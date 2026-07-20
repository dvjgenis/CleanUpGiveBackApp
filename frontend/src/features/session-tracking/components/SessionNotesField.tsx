import { StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';

import { colors, fontFamilies } from '@/features/figma-screens/tokens';

import {
  SESSION_NOTES_MAX_LENGTH,
  useSessionNotes,
} from '../sessionNotesStore';

type SessionNotesFieldProps = {
  sessionId?: string;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  inputStyle?: TextStyle;
  counterStyle?: TextStyle;
};

export function SessionNotesField({
  sessionId,
  containerStyle,
  titleStyle,
  inputStyle,
  counterStyle,
}: SessionNotesFieldProps) {
  const { notes, setNotes } = useSessionNotes(sessionId);

  return (
    <View style={[s.card, containerStyle]}>
      <Text style={[s.title, titleStyle]}>Notes</Text>
      <View style={s.inputWrapper}>
        <TextInput
          style={[s.input, inputStyle]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add personal notes about this session..."
          placeholderTextColor={colors.textNavInactive}
          multiline
          textAlignVertical="top"
          maxLength={SESSION_NOTES_MAX_LENGTH}
          editable={Boolean(sessionId)}
          accessibilityLabel="Session notes"
          accessibilityHint={`Up to ${SESSION_NOTES_MAX_LENGTH} characters`}
        />
        {notes.length > 0 ? (
          <Text style={[s.charCount, counterStyle]} accessibilityLiveRegion="polite">
            {notes.length}/{SESSION_NOTES_MAX_LENGTH}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputWrapper: {
    gap: 8,
  },
  input: {
    minHeight: 96,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    padding: 0,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
});
