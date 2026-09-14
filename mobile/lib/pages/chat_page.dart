import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../context/chat_context.dart';
import '../models/chat_model.dart';
import '../theme/app_theme.dart';
import '../components/chat_history_modal.dart';
import 'crisis_page.dart';

class ChatPage extends StatefulWidget {
  final bool initialOpenHistory;

  const ChatPage({super.key, this.initialOpenHistory = false});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  final List<String> _promptSuggestions = [
    'I feel very overwhelmed today',
    'Can we do a calming breathing exercise?',
    'I have trouble shutting off my mind at night',
    'How do I handle a panic attack?',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialOpenHistory) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showChatHistoryModal(context, onSessionSelected: _scrollToBottom);
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage([String? preset]) {
    final text = preset ?? _controller.text;
    if (text.trim().isEmpty) return;

    final chat = context.read<ChatContext>();
    chat.sendMessage(text);
    _controller.clear();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final chat = context.watch<ChatContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Text('🌿', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'MindCare Companion',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                  Text(
                    'Empathetic AI listener',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.normal),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded),
            tooltip: 'Chat History',
            onPressed: () => showChatHistoryModal(context, onSessionSelected: _scrollToBottom),
          ),
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            tooltip: 'New Conversation',
            onPressed: () => chat.resetSession(),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (chat.loadingHistory)
              const LinearProgressIndicator(
                color: AppTheme.primary,
                backgroundColor: Colors.transparent,
                minHeight: 2,
              ),

            // Active past session indicator banner
            if (chat.currentSessionTitle != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.cardDark : const Color(0xFFEFF6FF),
                  border: Border(
                    bottom: BorderSide(
                      color: AppTheme.primary.withValues(alpha: 0.2),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.history_rounded, size: 14, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Past chat: ${chat.currentSessionTitle}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        chat.startNewSession();
                        _scrollToBottom();
                      },
                      borderRadius: BorderRadius.circular(6),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        child: Text(
                          'New Chat',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            // High visibility Crisis Banner if triggered
            if (chat.crisisDetected) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: const Color(0xFFFEF2F2),
                child: Row(
                  children: [
                    const Text('🚨', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'You are not alone. Free, confidential support is available right now.',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF991B1B),
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const CrisisPage()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        minimumSize: const Size(60, 32),
                      ),
                      child: const Text('Helplines', style: TextStyle(fontSize: 11)),
                    ),
                  ],
                ),
              ),
            ],

            // Message List
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: chat.messages.length + (chat.isTyping ? 1 : 0),
                itemBuilder: (ctx, idx) {
                  if (idx == chat.messages.length && chat.isTyping) {
                    return _buildTypingIndicator(isDark);
                  }
                  final msg = chat.messages[idx];
                  return _buildMessageBubble(msg, isDark);
                },
              ),
            ),

            // Quick Prompt Suggestions (if few messages)
            if (chat.messages.length <= 2) ...[
              SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _promptSuggestions.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (ctx, i) {
                    return ActionChip(
                      label: Text(
                        _promptSuggestions[i],
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white : AppTheme.primaryDark,
                        ),
                      ),
                      backgroundColor: isDark
                          ? AppTheme.primaryDark.withValues(alpha: 0.2)
                          : AppTheme.primary.withValues(alpha: 0.08),
                      side: BorderSide(
                        color: AppTheme.primary.withValues(alpha: 0.2),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onPressed: () => _sendMessage(_promptSuggestions[i]),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
            ],

            // Input Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.cardDark : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Share what you are feeling...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    icon: const Icon(Icons.send_rounded, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: const CircleBorder(),
                    ),
                    onPressed: chat.isTyping ? null : () => _sendMessage(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isDark) {
    final isUser = msg.isUser;
    final timeStr = DateFormat('h:mm a').format(msg.timestamp);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8, bottom: 2),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Center(child: Text('🌿', style: TextStyle(fontSize: 16))),
            ),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser
                    ? AppTheme.primary
                    : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
              ),
              child: Column(
                crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Text(
                    msg.content,
                    style: TextStyle(
                      fontSize: 14.5,
                      height: 1.4,
                      color: isUser
                          ? Colors.white
                          : (isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    timeStr,
                    style: TextStyle(
                      fontSize: 10,
                      color: isUser
                          ? Colors.white70
                          : (isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Center(child: Text('🌿', style: TextStyle(fontSize: 16))),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                ),
                SizedBox(width: 8),
                Text('Thinking empathetically...', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
