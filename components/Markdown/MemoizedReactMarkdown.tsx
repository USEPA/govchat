import { FC, memo } from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import { ComponentProps } from 'react';

export const MemoizedReactMarkdown: FC<Options & ComponentProps<'div'>> = memo(
    ReactMarkdown,
    (prevProps, nextProps) => (
        prevProps.children === nextProps.children
    )
);
