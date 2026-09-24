import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_constants.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String? _cachedBaseUrl;
  String? _authToken;

  static String sanitizeUrl(String url) {
    String cleaned = url.trim();
    // Fix accidental dot or missing colon before port (e.g. 10.0.2.2.8080 or 10.0.2.28080 -> 10.0.2.2:8080)
    cleaned = cleaned.replaceAll('.8080', ':8080');
    cleaned = cleaned.replaceAllMapped(RegExp(r'(\d+\.\d+\.\d+\.\d+)8080'), (m) => '${m[1]}:8080');
    cleaned = cleaned.replaceAll('localhost8080', 'localhost:8080');

    // If local ip or emulator address is prefixed with https, change to http
    if (cleaned.startsWith('https://10.0.2.2') ||
        cleaned.startsWith('https://localhost') ||
        cleaned.startsWith('https://127.0.0.1') ||
        cleaned.startsWith('https://10.') ||
        cleaned.startsWith('https://192.168.')) {
      cleaned = cleaned.replaceFirst('https://', 'http://');
    } else if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'http://$cleaned';
    }

    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }

    if (!cleaned.endsWith('/api')) {
      cleaned = '$cleaned/api';
    }

    return cleaned;
  }

  Future<String> getBaseUrl() async {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('custom_base_url');
    _cachedBaseUrl = saved != null ? sanitizeUrl(saved) : ApiConstants.defaultBaseUrl;
    return _cachedBaseUrl!;
  }

  Future<void> setBaseUrl(String url) async {
    _cachedBaseUrl = sanitizeUrl(url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_base_url', _cachedBaseUrl!);
  }

  Future<void> setAuthToken(String? token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('jwt_token', token);
    } else {
      await prefs.remove('jwt_token');
    }
  }

  Future<String?> getAuthToken() async {
    if (_authToken != null) return _authToken;
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('jwt_token');
    return _authToken;
  }

  Future<Map<String, String>> _headers() async {
    final token = await getAuthToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  dynamic _processResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(utf8.decode(response.bodyBytes));
    } catch (_) {
      body = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body is Map<String, dynamic> && body.containsKey('data')) {
        return body['data'];
      }
      return body;
    }

    String errorMsg = 'An unexpected error occurred (${response.statusCode})';
    if (body is Map<String, dynamic>) {
      if (body['message'] != null) {
        errorMsg = body['message'].toString();
      } else if (body['error'] != null) {
        errorMsg = body['error'].toString();
      }
    }

    throw ApiException(errorMsg, statusCode: response.statusCode);
  }

  Future<dynamic> get(String endpoint) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _headers();

    try {
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server. Please verify the server is running at $baseUrl');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> post(String endpoint, dynamic data) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _headers();

    try {
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 25));
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server at $baseUrl');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> put(String endpoint, dynamic data) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _headers();

    try {
      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server at $baseUrl');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }

  Future<dynamic> delete(String endpoint) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _headers();

    try {
      final response = await http.delete(url, headers: headers).timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to server at $baseUrl');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: $e');
    }
  }
}
