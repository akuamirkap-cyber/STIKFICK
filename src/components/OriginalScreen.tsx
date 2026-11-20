import OriginalApp from '../original/OriginalApp';
import css from '../original/original.css?inline';

export default function OriginalScreen() {
  return (
    <>
      <style>{css}</style>
      <OriginalApp />
    </>
  );
}
