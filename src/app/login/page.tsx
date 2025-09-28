import Image from 'next/image';
import SignInButton from '~/components/SignInButton';

export default function LoginPage() {
  return (
    <div>
      <main className="relative z-10 row-start-2 flex h-screen flex-col items-center justify-end gap-[32px]">
        <div className="absolute top-1/2 left-1/2 flex size-[300px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2">
          <Image src="/logo.webp" alt="Logo" width={250} height={250} />
        </div>
        <div className="flex w-full flex-col items-center gap-4 px-8 pb-4 sm:flex-row">
          <SignInButton />
        </div>
      </main>

      {/* <DitheringBackground /> */}
    </div>
  );
}
