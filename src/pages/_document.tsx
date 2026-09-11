import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head>
        <meta name="theme-color" content="#051424" />
        <meta name="description" content="Turn long videos into ranked, captioned, vertically reframed short-form clips." />
      </Head>
      <body className="min-h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
