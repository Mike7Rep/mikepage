// app/api/cv-pdf/route.ts


import puppeteer from "puppeteer"

export const runtime = "nodejs"

export async function GET() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    await page.goto(`${baseUrl}/cv/print`, {
      waitUntil: "networkidle2",
    })

    await page.emulateMediaType("screen")

    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `,
    })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    })

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="2026_CV_MichaelRepolusk.pdf"',
      },
    })
  } finally {
    await browser.close()
  }
}