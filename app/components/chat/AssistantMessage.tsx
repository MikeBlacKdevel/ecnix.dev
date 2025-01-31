import { memo } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';

interface AssistantMessageProps {
  content: string;
  annotations?: JSONValue[];
}

export const AssistantMessage = memo(({ content, annotations }: AssistantMessageProps) => {
  // Filtramos las anotaciones que son objetos y contienen la clave 'type'
  const filteredAnnotations = (annotations?.filter(
    (annotation: JSONValue) => annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
  ) || []) as { type: string; value: any }[];

  // Extraemos la información de uso de los tokens
  const usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value;

  return (
    <div className="overflow-hidden w-full">
      {usage && (
        <div className="text-sm text-bolt-elements-textSecondary mb-2">
          Tokens: {usage.totalTokens} (prompt: {usage.promptTokens}, completion: {usage.completionTokens})
        </div>
      )}
      {/* Mostramos el contenido con formato Markdown */}
      <Markdown html>{content}</Markdown>
    </div>
  );
});
