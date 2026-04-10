import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useVoiceStore } from '../../store/voice.store';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { WS_BASE_URL } from '../../constants/config';
import * as Speech from 'expo-speech';

export default function VoiceScreen() {
  const { state, aiProvider, messages, currentResponse, currentTranscript,
    setState, setAIProvider, addMessage, setCurrentTranscript, setCurrentResponse, appendToResponse } = useVoiceStore();
  const { user, token } = useAuthStore();
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sentenceBuf = useRef('');

  useEffect(() => {
    connectWS();
    return () => ws.current?.close();
  }, [aiProvider, token]);

  const connectWS = () => {
    if (ws.current) ws.current.close();
    const url = `${WS_BASE_URL}?userId=${user?.uid}&ai=${aiProvider}&token=${token}`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => setState('idle');
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'delta') {
        appendToResponse(data.delta);
        sentenceBuf.current += data.delta;
        // Speak sentence when complete
        const match = sentenceBuf.current.match(/^([^.!?]+[.!?]+)\s*/);
        if (match) {
          Speech.speak(match[1], { language: 'en-US', rate: 0.95 });
          sentenceBuf.current = sentenceBuf.current.slice(match[0].length);
        }
        setState('speaking');
      }
      if (data.type === 'done') {
        if (sentenceBuf.current.trim()) Speech.speak(sentenceBuf.current.trim());
        sentenceBuf.current = '';
        addMessage({ role: 'assistant', content: data.fullResponse, timestamp: Date.now() });
        setCurrentResponse('');
        setState('idle');
        scrollRef.current?.scrollToEnd({ animated: true });
      }
      if (data.type === 'error') setState('error');
    };
    ws.current.onerror = () => setState('error');
    ws.current.onclose = () => {};
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    addMessage({ role: 'user', content: text, timestamp: Date.now() });
    setCurrentTranscript('');
    setState('processing');
    setCurrentResponse('');
    ws.current.send(JSON.stringify({ type: 'chat', text }));
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleVoiceTap = async () => {
    if (state === 'idle') {
      // In EAS build, use expo-av to record + send to Whisper
      // For now, show text fallback
      setShowTextInput(true);
    }
  };

  const orbColor = {
    idle: COLORS.primary,
    listening: COLORS.success,
    processing: COLORS.warning,
    speaking: COLORS.claude,
    error: COLORS.error,
  }[state];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Voice Assistant</Text>
        <View style={styles.aiToggle}>
          {(['claude', 'gemini'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.aiPill, aiProvider === p && styles.aiPillActive]}
              onPress={() => { setAIProvider(p); connectWS(); }}
            >
              <Text style={[styles.aiPillText, aiProvider === p && styles.aiPillTextActive]}>
                {p === 'claude' ? 'Claude' : 'Gemini'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conversation */}
      <ScrollView ref={scrollRef} style={styles.conversation} contentContainerStyle={styles.conversationContent}>
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyTitle}>Ready to help</Text>
            <Text style={styles.emptySubtitle}>Tap the orb to speak, or type below</Text>
          </View>
        )}
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.bubbleText}>{msg.content}</Text>
          </View>
        ))}
        {currentResponse && (
          <View style={styles.aiBubble}>
            <Text style={styles.bubbleText}>{currentResponse}</Text>
            <Text style={styles.streamingDot}>●</Text>
          </View>
        )}
      </ScrollView>

      {/* Voice Orb */}
      <TouchableOpacity
        style={[styles.orb, { backgroundColor: orbColor + '20', borderColor: orbColor }]}
        onPress={handleVoiceTap}
        disabled={state === 'processing' || state === 'speaking'}
      >
        <View style={[styles.orbInner, { backgroundColor: orbColor }]}>
          <Text style={styles.orbIcon}>
            {state === 'idle' ? '🎙️' : state === 'listening' ? '👂' : state === 'processing' ? '⏳' : state === 'speaking' ? '🔊' : '⚠️'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.stateLabel}>
        {state === 'idle' ? 'Tap to speak' : state === 'listening' ? 'Listening...' : state === 'processing' ? 'Thinking...' : state === 'speaking' ? 'Speaking...' : 'Error — tap to retry'}
      </Text>

      {/* Text input */}
      {showTextInput && (
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            value={textInput}
            onChangeText={setTextInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={() => { sendMessage(textInput); setTextInput(''); setShowTextInput(false); }}
            autoFocus
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => { sendMessage(textInput); setTextInput(''); setShowTextInput(false); }}
          >
            <Text style={{ color: COLORS.text, fontSize: FONT_SIZE.md }}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => setShowTextInput(!showTextInput)} style={styles.keyboardToggle}>
        <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.sm }}>⌨️ Type instead</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 60 },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  aiToggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.full, padding: 3, gap: 2 },
  aiPill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  aiPillActive: { backgroundColor: COLORS.primary },
  aiPillText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  aiPillTextActive: { color: COLORS.text },
  conversation: { flex: 1, paddingHorizontal: SPACING.lg },
  conversationContent: { gap: SPACING.sm, paddingBottom: SPACING.xl },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxl * 2 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.sm },
  bubble: { borderRadius: RADIUS.md, padding: SPACING.md, maxWidth: '85%' },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: COLORS.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { color: COLORS.text, fontSize: FONT_SIZE.md, lineHeight: 22 },
  streamingDot: { color: COLORS.primary, fontSize: 10, marginTop: 4 },
  orb: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.lg },
  orbInner: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  orbIcon: { fontSize: 36 },
  stateLabel: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  textInputRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  textInput: { flex: 1, color: COLORS.text, fontSize: FONT_SIZE.md, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  sendButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, justifyContent: 'center' },
  keyboardToggle: { alignItems: 'center', paddingBottom: SPACING.lg },
});
