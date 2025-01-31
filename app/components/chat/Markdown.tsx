import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { BundledLanguage } from 'shiki';
import { createScopedLogger } from '~/utils/logger';
import { rehypePlugins, remarkPlugins, allowedHTMLElements } from '~/utils/markdown';
import { Artifact } from './Artifact';
import { CodeBlock } from './CodeBlock';

import styles from './Markdown.module.scss';

const logger = createScopedLogger('MarkdownComponent');

interface MarkdownProps {
  children: string;
  html?: boolean;
  limitedMarkdown?: boolean;
}

export const Markdown = memo(({ children, html = false, limitedMarkdown = false }: MarkdownProps) => {
  logger.trace('Render');

  const components = useMemo(() => {
    return {
      div: ({ className, children, node, ...props }) => {
        if (className?.includes('__boltArtifact__')) {
          const messageId = node?.properties.dataMessageId as string;

          if (!messageId) {
            logger.error(`Mensaje Id invalido ${messageId}`);
          }

          return <Artifact messageId={messageId} />;
        }

        return (
          <div className={className} {...props}>
            {children}
          </div>
        );
      },
      pre: (props) => {
        const { children, node, ...rest } = props;

        const [firstChild] = node?.children ?? [];

        if (
          firstChild &&
          firstChild.type === 'element' &&
          firstChild.tagName === 'code' &&
          firstChild.children[0].type === 'text'
        ) {
          const { className, ...rest } = firstChild.properties;
          const [, language = 'plaintext'] = /language-(\w+)/.exec(String(className) || '') ?? [];

          return <CodeBlock code={firstChild.children[0].value} language={language as BundledLanguage} {...rest} />;
        }

        return <pre {...rest}>{children}</pre>;
      },
    } satisfies Components;
  }, []);

  return (
    <ReactMarkdown
      allowedElements={allowedHTMLElements}
      className={styles.MarkdownContent}
      components={components}
      remarkPlugins={remarkPlugins(limitedMarkdown)}
      rehypePlugins={rehypePlugins(html)}
    >
      {stripCodeFenceFromArtifact(children)}
    </ReactMarkdown>
  );
});

/**
 * Elimina los delimitadores de código (```) que rodean un elemento de artefacto mientras conserva el contenido del artefacto.
 * Esto es necesario porque los artefactos no deben estar envueltos en bloques de código cuando se renderizan para una lista de acciones.
 *
 * @param content - El contenido markdown a procesar
 * @returns El contenido procesado con los delimitadores de código eliminados alrededor de los artefactos
 *
 * @example
 * // Elimina los delimitadores de código alrededor de un artefacto
 * const input = "```xml\n<div class='__boltArtifact__'></div>\n```";
 * stripCodeFenceFromArtifact(input);
 * // Retorna: "\n<div class='__boltArtifact__'></div>\n"
 *
 * @remarks
 * - Solo elimina los delimitadores de código que envuelven directamente un artefacto (marcado con la clase __boltArtifact__)
 * - Maneja delimitadores de código con especificaciones de lenguaje opcionales (por ejemplo, ```xml, ```typescript)
 * - Conserva el contenido original si no se encuentra un artefacto
 * - Maneja de forma segura casos extremos como entradas vacías o artefactos al inicio o final del contenido
 */
export const stripCodeFenceFromArtifact = (content: string) => {
  if (!content || !content.includes('__boltArtifact__')) {
    return content;
  }

  const lines = content.split('\n');
  const artifactLineIndex = lines.findIndex((line) => line.includes('__boltArtifact__'));

  // Retorna el contenido original si no se encuentra la línea del artefacto
  if (artifactLineIndex === -1) {
    return content;
  }

  // Verifica la línea anterior en busca de delimitador de código
  if (artifactLineIndex > 0 && lines[artifactLineIndex - 1]?.trim().match(/^```\w*$/)) {
    lines[artifactLineIndex - 1] = '';
  }

  if (artifactLineIndex < lines.length - 1 && lines[artifactLineIndex + 1]?.trim().match(/^```$/)) {
    lines[artifactLineIndex + 1] = '';
  }

  return lines.join('\n');
};
