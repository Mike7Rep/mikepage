//


"use client"

import Script from "next/script"

export default function BookingPage() {
  return (
    <section className="w-full h-screen flex justify-center items-center">

      <div
        id="zeeg-embed-michaelrepolusk"
        className="zeeg-inline-widget w-9/10 max-w-7xl h-8/10"
      />

      <Script
        src="https://assets.zeeg.me/embed.min.js"
        data-user="michaelrepolusk"
        strategy="afterInteractive"
      />

    </section>
  )
}