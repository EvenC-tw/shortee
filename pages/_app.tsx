import { Layout as AntdLayout, Button, Input, Typography } from 'antd';

import { AppProps } from 'next/app';
import Link from 'next/link';
import styled from 'styled-components';
import themeVariables from '../styles/theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.div``;

const Content = styled.div`
  flex: 1;
  overflow: auto;
`;

const Footer = styled.div``;
const Layout = styled(AntdLayout)`
  background-color: ${themeVariables['@text-color']};
  ${Header} {
    position: fixed;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 72px;
    background-color: #08090a;
    color: #e5e5e5;
    z-index: 1;
    p {
      font-size: 1.5rem;
    }
  }
  ${Content} {
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: calc(72px + 24px) 24px calc(60px + 24px);
    background-color: #000000;
  }
  ${Footer} {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 60px;
    background-color: #2a3137;
    z-index: 1;
  }
`;

const Title = styled.h1``;

const StyledLink = styled.a`
  color: #ffffff;
  text-decoration: none;

  :hover {
    color: ${themeVariables['@primary-color']};
  }
`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Header>
        <Title><Typography.Title>Let&apos;s Get Shortee!</Typography.Title></Title>
      </Header>
      <Content>
        <Component {...pageProps} />
      </Content>
      <Footer>
        powered by{' '}
        <Link href="mailto:even@evenc.studio">
          <StyledLink>Even</StyledLink>
        </Link>
      </Footer>
    </Layout>
  );
}

export default MyApp;
