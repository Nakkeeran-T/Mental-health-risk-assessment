class User {
  final int? id;
  final String email;
  final String? fullName;
  final String? firstName;
  final String? lastName;
  final String? role;

  User({
    this.id,
    required this.email,
    this.fullName,
    this.firstName,
    this.lastName,
    this.role,
  });

  /// Guaranteed non-empty display name for UI greetings and profile headers
  String get displayName {
    if (fullName != null && fullName!.trim().isNotEmpty) {
      return fullName!.trim();
    }
    if (firstName != null && firstName!.trim().isNotEmpty) {
      if (lastName != null && lastName!.trim().isNotEmpty) {
        return '${firstName!.trim()} ${lastName!.trim()}';
      }
      return firstName!.trim();
    }
    if (email.isNotEmpty && email.contains('@')) {
      final prefix = email.split('@').first.trim();
      if (prefix.isNotEmpty) {
        return prefix[0].toUpperCase() + prefix.substring(1);
      }
    }
    return 'Friend';
  }

  factory User.fromJson(Map<String, dynamic> json) {
    final rawFirst = json['firstName']?.toString().trim();
    final rawLast = json['lastName']?.toString().trim();
    String? name = json['fullName']?.toString().trim() ?? json['name']?.toString().trim();

    if ((name == null || name.isEmpty) && rawFirst != null && rawFirst.isNotEmpty) {
      name = (rawLast != null && rawLast.isNotEmpty) ? '$rawFirst $rawLast' : rawFirst;
    }

    final rawId = json['id'] ?? json['userId'];

    return User(
      id: rawId is int ? rawId : int.tryParse(rawId?.toString() ?? ''),
      email: json['email']?.toString() ?? '',
      fullName: (name != null && name.isNotEmpty) ? name : null,
      firstName: rawFirst,
      lastName: rawLast,
      role: json['role']?.toString() ?? 'USER',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'fullName': fullName,
    'firstName': firstName,
    'lastName': lastName,
    'role': role,
  };
}

class AuthResponse {
  final String token;
  final String type;
  final int? id;
  final String email;
  final String? fullName;
  final String? firstName;
  final String? lastName;
  final String? role;

  AuthResponse({
    required this.token,
    this.type = 'Bearer',
    this.id,
    required this.email,
    this.fullName,
    this.firstName,
    this.lastName,
    this.role,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final rawFirst = json['firstName']?.toString().trim();
    final rawLast = json['lastName']?.toString().trim();
    String? name = json['fullName']?.toString().trim() ?? json['name']?.toString().trim();

    if ((name == null || name.isEmpty) && rawFirst != null && rawFirst.isNotEmpty) {
      name = (rawLast != null && rawLast.isNotEmpty) ? '$rawFirst $rawLast' : rawFirst;
    }

    final rawId = json['userId'] ?? json['id'];

    return AuthResponse(
      token: json['token']?.toString() ?? '',
      type: json['type']?.toString() ?? 'Bearer',
      id: rawId is int ? rawId : int.tryParse(rawId?.toString() ?? ''),
      email: json['email']?.toString() ?? '',
      fullName: (name != null && name.isNotEmpty) ? name : null,
      firstName: rawFirst,
      lastName: rawLast,
      role: json['role']?.toString() ?? 'USER',
    );
  }

  User toUser() => User(
    id: id,
    email: email,
    fullName: fullName,
    firstName: firstName,
    lastName: lastName,
    role: role,
  );
}
