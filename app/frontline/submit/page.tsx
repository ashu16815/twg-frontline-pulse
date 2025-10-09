import PasscodeGate from '@/components/PasscodeGate';
import FrontlineForm from '@/components/FrontlineForm';

export default function Page() {
  return (
    <PasscodeGate>
      <FrontlineForm />
    </PasscodeGate>
  );
}

