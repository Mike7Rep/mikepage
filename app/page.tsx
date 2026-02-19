// app/page.tsx

import Image from "next/image";
import MotionSchriftzug from "@/components/motionSchriftzug"

export default function Page() {
    return (
        <section className="relative h-screen w-screen overflow-hidden bg-background">


            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <Image
                    src="/image/mike.png"
                    alt="Michael Repolusk"
                    width={800}
                    height={1000}
                    priority
                    className="max-w-none"
                />
            </div>


            <div className={"absolute bottom-20"}>
                <MotionSchriftzug text={"Michael Repolusk |"}/>
            </div>

        </section>
    );
}