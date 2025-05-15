import { DocumentProps, Head, Html, Main, NextScript } from 'next/document';

import i18nextConfig from '../next-i18next.config';


type Props = DocumentProps & {
  // add custom document props
};

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;
  return (
    <Html lang={currentLocale}>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Gov Chat"></meta>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.__MODEL_SELECT_FLAGS__ = {
                  prod: ${process.env.MODEL_SELECT_PROD_FLAG === 'true'},
                  stage: ${process.env.MODEL_SELECT_STAGE_FLAG === 'true'}
                };
              `,
            }}
          />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
