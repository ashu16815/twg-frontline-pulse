export default function Skeleton({ h = '2rem' }: { h?: string }) {
  return <div className='wis-skeleton' style={{ height: h }} />;
}

