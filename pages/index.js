import { Input as AntdInput, Button } from 'antd';

import styled from 'styled-components';
import themeVariables from '../styles/theme';
import { useRouter } from 'next/router';
import { useState } from 'react';
import uuidBase62 from 'uuid-base62';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
`;

const Input = styled(AntdInput)``;

const Paragraph = styled.p`
  margin-top: 24px;
  word-break: break-all;
  font-size: 1.25rem;
`;

const InputWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  &&& {
    ${Input} {
      background-color: ${themeVariables['@text-color']};
    }
  }
  .ant-input-group.ant-input-group-compact {
    display: inline-flex;
  }
`;

function Home() {
  const [fetching, setFetching] = useState(false);
  const [shorteeing, setShorteeing] = useState(false);
  const [url, setUrl] = useState('');
  const [shortee, setShortee] = useState('');
  const [shortees, setShortees] = useState([]);
  const router = useRouter();

  function handleUrlInput({ target: { value } }) {
    try {
      let parsedUrl = new URL(value);

      setUrl(parsedUrl);
    } catch (error) {
      console.error('Invalid URL:', error);

      if (!value.startsWith(`http://`) && !value.startsWith(`https://`)) {
        try {
          let parsedUrl = new URL(`https://${value}`);
          setUrl(parsedUrl);
        } catch (httpsError) {
          try {
            let parsedUrl = new URL(`http://${value}`);
            setUrl(parsedUrl);
          } catch (httpError) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
  }

  // Fetch shortee
  async function fetchShortee() {
    // change fetching state
    setFetching(true);

    try {
      // Get Shortee
      fetch('/api/shortee', {
        method: 'GET',
      })
        .then(async (res) => {
          const data = await res.json();
          setShortees(data);
        })
        .finally(() => {
          // reset the fetching state
          setFetching(false);
        });
    } catch (error) {
      // Stop fetching state
      return setFetching(false);
    }
  }

  // Add new shortee
  async function postShortee() {
    // change shorteeing state
    setShorteeing(true);

    const validUrl = url.href;
    const tempShortee = uuidBase62.v4(validUrl).substring(0, 6);

    try {
      // Post Shortee
      fetch('/api/shortee', {
        method: 'POST',
        body: JSON.stringify({
          origin: validUrl,
          shortee: tempShortee,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          setShortee(tempShortee);
        })
        .finally(() => {
          // reset the shorteeing state
          setShorteeing(false);
        });
    } catch (error) {
      // Stop shorteeing state
      return setShorteeing(false);
    }
  }

  return (
    <Container>
      <InputWrapper>
        {/* <Input.Group compact> */}
        <Input
          size="large"
          addonBefore="(https//)"
          placeholder="enter URL here..."
          onInput={handleUrlInput}
          onKeyDown={({ key }) => key === 'Enter' && postShortee()}
        />
        <Button size="large" type="button" onClick={postShortee}>
          {shorteeing ? 'Shorteeing...' : 'Shortee!'}
        </Button>
        {/* </Input.Group> */}
      </InputWrapper>
      {shortee && (
        <a href={`${location.origin}/${shortee}`} target="_blank" rel="noopener noreferrer">
          <Paragraph
            copyable={{
              tooltips: false,
            }}
          >
            {`${location.origin}/${shortee}`}
          </Paragraph>
        </a>
      )}

      {/* {
        <Button type="button" onClick={getShortee}>
          {fetching ? 'Fetching' : 'Fetch'}
        </Button>
      } */}
      {/* <ul>
        {shortees?.map((shortee) => (
          <li>{`${shortee._id}: ${shortee.shortee}`}</li>
        ))}
      </ul> */}
    </Container>
  );
}

export default Home;
