import useReveal from '../hooks/useReveal';

/** Scroll-triggered reveal wrapper for landing sections and blocks. */
export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  ...rest
}) {
  const { ref, visible } = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-revealed' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
