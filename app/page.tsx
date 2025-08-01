import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
    return (
        <div className='flex flex-col items-center'>
            <p className='text-3xl font-bold text-indigo-500'>
                Hello Discord Clone
            </p>
            <Button className='cursor-pointer'>
                Click Me
            </Button>
        </div>
    );
}