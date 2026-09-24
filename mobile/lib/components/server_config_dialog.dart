import 'package:flutter/material.dart';
import '../api/api_client.dart';

/// Displays a reusable dialog allowing the user to configure backend server connection URL.
Future<void> showServerConfigDialog(BuildContext context, {VoidCallback? onUrlUpdated}) async {
  final apiClient = ApiClient();
  final currentUrl = await apiClient.getBaseUrl();
  if (!context.mounted) return;

  final urlController = TextEditingController(text: currentUrl);

  await showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.dns_rounded, size: 22),
          SizedBox(width: 8),
          Text('Server URL Config'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select environment preset or enter custom host:',
              style: TextStyle(fontSize: 12.5, height: 1.4),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('USB Phone (Localhost)', style: TextStyle(fontSize: 11)),
                  onPressed: () => urlController.text = 'http://localhost:8080/api',
                ),
                ActionChip(
                  label: const Text('Wi-Fi Network', style: TextStyle(fontSize: 11)),
                  onPressed: () => urlController.text = 'http://10.238.7.133:8080/api',
                ),
                ActionChip(
                  label: const Text('Android Emulator', style: TextStyle(fontSize: 11)),
                  onPressed: () => urlController.text = 'http://10.0.2.2:8080/api',
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                labelText: 'API Base URL',
                hintText: 'http://10.0.2.2:8080/api',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Tip: If running on a physical Android device connected via USB, execute:\n`adb reverse tcp:8080 tcp:8080`\nand use Localhost.',
                style: TextStyle(fontSize: 11, height: 1.3, color: Colors.blueGrey),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            final trimmed = urlController.text.trim();
            if (trimmed.isNotEmpty) {
              await apiClient.setBaseUrl(trimmed);
              if (ctx.mounted) Navigator.pop(ctx);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Server URL successfully updated!')),
                );
              }
              onUrlUpdated?.call();
            }
          },
          child: const Text('Save'),
        ),
      ],
    ),
  );
}
