import { Input as AntdInput, Button, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import uuidBase62 from 'uuid-base62';

// Hook
function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();
  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

const { Paragraph: AntdParagraph } = Typography;
const Input = styled(AntdInput)``;
const Paragraph = styled(AntdParagraph)`
  margin-top: 24px;
  word-break: break-all;
  font-size: 1.25rem;
  color: #e5e5e5;
`;
const InputWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  ${Input} {
    width: calc(100% - 25vw);
  }
`;

function Shortee() {
  const [fetching, setFetching] = useState(false);
  const [shortee, setShortee] = useState(undefined);
  const router = useRouter();
  const prevShortee = usePrevious(shortee);
  // Fetch shortee
  const fetchShortee = useCallback(async () => {
    // change fetching state
    setFetching(true);
    try {
      // Get Shortee
      fetch(`/api/shortee?shortee=${shortee}`, {
        method: 'GET',
      })
        .then(async (res) => {
          const data = await res.json();
          const { origin } = data;
          location.href = `${origin}`;
        })
        .finally(() => {
          // reset the fetching state
          setFetching(false);
        });

      // // reload the page
      // return router.push(router.asPath);
    } catch (error) {
      // Stop fetching state
      return setFetching(false);
    }
  }, [shortee, setFetching]);

  useEffect(() => {
    if (router?.asPath !== '/') {
      setShortee(router.asPath.split('/')[1]);
    }
  }, [router.asPath, setShortee]);

  useEffect(() => {
    if (shortee !== undefined && shortee !== prevShortee) {
      fetchShortee();
    }
  }, [shortee, prevShortee, fetchShortee]);

  return <></>;
}

export default Shortee;
