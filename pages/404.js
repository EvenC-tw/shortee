import { Input as AntdInput, Button, Typography, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/router';

// Hook 用於取得前一個 state 的值
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]); // 只有在 value 變動時才重新執行
  return ref.current; // 回傳更新前的舊值
}

function Shortee() {
  const [fetching, setFetching] = useState(false);
  const [shortee, setShortee] = useState(undefined);
  const router = useRouter();
  const prevShortee = usePrevious(shortee);

  // 根據短網址代碼 (shortee) 取得原始網址並執行跳轉
  const fetchShortee = useCallback(async () => {
    if (!shortee) return; // 若 shortee 未設定則不執行

    setFetching(true);
    try {
      const response = await fetch(`/api/shortee?shortee=${shortee}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '取得短網址詳細資訊時發生錯誤。' })); // 修改註解
        throw new Error(errorData.message || `伺服器錯誤: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.origin) {
        try {
          new URL(data.origin); // 驗證 URL 結構
          location.href = data.origin;
        } catch (urlError) {
          console.error("收到的原始 URL 無效:", data.origin, urlError); // 修改註解
          message.error('擷取到的網址無效，若問題持續發生請聯絡技術支援。');
          // 可選：導向至自訂錯誤頁面或顯示內嵌錯誤元件
          // router.push('/invalid-url-error'); 
        }
      } else if (data && data.success === false) {
        console.error("API 在取得 shortee 時回傳失敗:", data.message); // 修改註解
        message.error(data.message || '無法擷取短網址。');
        // router.push('/not-found'); // 或導向至更特定的錯誤頁面
      } else {
        console.warn(`找不到短網址 '${shortee}' 或 API 回應中缺少 origin 欄位。`); // 修改註解
        message.error(`找不到短網址 '${shortee}' 或該網址無效。`);
        // router.push('/not-found');
      }
    } catch (error) {
      console.error("fetchShortee 函數出錯:", error); // 修改註解
      message.error(error.message || '取得短網址時發生錯誤。');
      // 可選：導向至一般錯誤頁面
      // router.push('/error');
    } finally {
      setFetching(false);
    }
  }, [shortee]); // 若 router 用於導航，將其加入 useCallback 的依賴陣列

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
