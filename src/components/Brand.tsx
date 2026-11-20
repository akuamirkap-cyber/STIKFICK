export function PigeonMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 46" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="m2 5 27 12.3L14.1 3l20.7 11.2 5.9-3 7.5 3.5-6.2 1.7-5.6 9.9-11.7 5.2-8.8 10 1.2-12.2L2 5Z"
      />
      <path fill="#11130e" d="m6.7 9.5 23 12.3-6.9 2.4L6.7 9.5Zm16 19.2 11.4-5-7.2 6.5-4.2-1.5Z" />
      <path fill="#11130e" d="m38.6 14.8 3.2-.5-2.3 1.9-.9-1.4Z" />
    </svg>
  );
}

export default function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? 'brand-small' : ''}`}>
      <PigeonMark size={small ? 29 : 44} />
      <span className="brand-type">
        <b>PIGEON</b>
        <span>ARCADE</span>
      </span>
    </span>
  );
}
