import { CHAT_MESSAGE_MAX_LENGTH } from '~/lib/constants/chat';

/**
 * Validates and sanitizes chat message text
 * @param text Raw input text
 * @returns Sanitized text or null if invalid
 */
export function validateMessageText(text: string): string | null {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return null;
  }
  
  if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) {
    return trimmed.slice(0, CHAT_MESSAGE_MAX_LENGTH);
  }
  
  return trimmed;
}

/**
 * Checks if a message contains prohibited content
 * @param text Message text to validate
 * @returns True if message contains prohibited content
 */
export function containsProhibitedContent(text: string): boolean {
  // This would typically import from existing validation
  // For now, keeping it simple
  const prohibitedPatterns = [
    /https?:\/\/\S+/gi, // URLs
    /www\.\S+/gi,       // www links
  ];
  
  return prohibitedPatterns.some(pattern => pattern.test(text));
}

/**
 * Generates validation error message for prohibited content
 * @param text Message text
 * @returns Error message or null if valid
 */
export function getValidationError(text: string): string | null {
  if (!text.trim()) {
    return 'Message cannot be empty';
  }
  
  if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
    return `Message too long (max ${CHAT_MESSAGE_MAX_LENGTH} characters)`;
  }
  
  if (containsProhibitedContent(text)) {
    return 'Links are not allowed';
  }
  
  return null;
}

/**
 * Checks if user can send a message based on various conditions
 * @param text Message text
 * @param isConnected WebSocket connection status
 * @param isRateLimited Rate limit status
 * @param isSending Current sending status
 * @returns True if user can send the message
 */
export function canSendMessage(
  text: string,
  isConnected: boolean,
  isRateLimited: boolean,
  isSending: boolean,
): boolean {
  if (!isConnected || isRateLimited || isSending) {
    return false;
  }
  
  const validatedText = validateMessageText(text);
  return validatedText !== null && getValidationError(validatedText) === null;
}