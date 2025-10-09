export default function Spinner({ size = '1rem' }: { size?: string }) {
  return <span className='wis-spinner inline-block align-middle' style={{ width: size, height: size }} />;
}

