import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../context/chat_context.dart';
import '../theme/app_theme.dart';

/// Opens the bottom sheet modal for browsing, activating, or deleting chat sessions.
void showChatHistoryModal(BuildContext context, {VoidCallback? onSessionSelected}) {
  context.read<ChatContext>().fetchSessions();

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (modalCtx) {
      return Consumer<ChatContext>(
        builder: (ctx, chat, _) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          final sessions = chat.sessions;

          return Container(
            height: MediaQuery.of(ctx).size.height * 0.72,
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 20,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Drag Handle
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),

                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Chat History',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          if (sessions.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${sessions.length}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          chat.startNewSession();
                          Navigator.pop(modalCtx);
                          onSessionSelected?.call();
                        },
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text('New Chat', style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          minimumSize: const Size(0, 34),
                        ),
                      ),
                    ],
                  ),
                ),

                const Divider(height: 1),

                // Sessions List
                Expanded(
                  child: chat.loadingSessions
                      ? const Center(
                          child: CircularProgressIndicator(color: AppTheme.primary),
                        )
                      : sessions.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(32),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary.withValues(alpha: 0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.chat_bubble_outline_rounded,
                                        size: 32,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    const Text(
                                      'No Saved Conversations Yet',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Start talking with your AI companion and your conversations will be automatically saved here.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              itemCount: sessions.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 8),
                              itemBuilder: (itemCtx, idx) {
                                final s = sessions[idx];
                                final isActive = s.sessionId == chat.sessionId;
                                final dateStr = DateFormat('MMM d, h:mm a').format(s.createdAt);

                                return InkWell(
                                  onTap: () {
                                    chat.loadSession(s.sessionId, title: s.title);
                                    Navigator.pop(modalCtx);
                                    onSessionSelected?.call();
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: isActive
                                          ? AppTheme.primary.withValues(alpha: 0.1)
                                          : (isDark ? AppTheme.cardDark : const Color(0xFFF8FAFC)),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: isActive
                                            ? AppTheme.primary
                                            : (isDark ? AppTheme.borderDark : AppTheme.borderLight),
                                        width: isActive ? 1.5 : 1,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: isActive
                                                ? AppTheme.primary
                                                : Colors.grey.withValues(alpha: 0.15),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            Icons.chat_bubble_rounded,
                                            size: 16,
                                            color: isActive ? Colors.white : Colors.grey,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      s.title,
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                      style: TextStyle(
                                                        fontSize: 14,
                                                        fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                                                        color: isActive ? AppTheme.primary : null,
                                                      ),
                                                    ),
                                                  ),
                                                  if (isActive) ...[
                                                    const SizedBox(width: 6),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                      decoration: BoxDecoration(
                                                        color: AppTheme.primary,
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: const Text(
                                                        'Active',
                                                        style: TextStyle(
                                                          fontSize: 9,
                                                          color: Colors.white,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              const SizedBox(height: 3),
                                              Row(
                                                children: [
                                                  Text(
                                                    dateStr,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    '• ${s.messageCount} msg${s.messageCount == 1 ? '' : 's'}',
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline_rounded, size: 18),
                                          color: Colors.red.withValues(alpha: 0.7),
                                          tooltip: 'Delete Chat',
                                          onPressed: () {
                                            chat.deleteSession(s.sessionId);
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}
