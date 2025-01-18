import { Data, QnA } from '@/types/chat';
import React, { useState } from 'react';

const Upload: React.FC = () => {
  const [fileContent, setFileContent] = useState<QnA[] | null>(null);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const readFileAsync = (file: File): Promise<QnA[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const content = JSON.parse(reader.result as string);
          resolve(content);
        } catch (e) {
          reject(e);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const content = await readFileAsync(file);
        setFileContent(content);
        setError(null);
      } catch (e) {
        setError('Failed to read file: ' + (e as Error).message);
      }
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };



  const handleSubmit = async () => {
    if (fileContent && password) {
      const batchSize = 100;
      for (let i = 0; i < fileContent.length; i += batchSize) {
        const batch = fileContent.slice(i, i + batchSize);
        try {
          const response = await fetch('/api/uploadjson', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qna: batch, pass: password }),
          });

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const result = await response.json() as Data;
          if (result.status !== "success") {
            setMessage('Faild update!');
            break;
          }
          else {
            setMessage('File and password submitted successfully!');
          }
        } catch (e) {
          setError('Failed to submit data: ' + e);
          break;
        }
      }
    } else {
      setError('Please select a file and enter a password');
    }
  };

  const handleButtonClick = () => {
    document.getElementById('fileInput')?.click();
  };

  return (
    <div className="flex flex-1 dark">
      <div className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className="prose mt-[-2px] w-full dark:prose-invert">
          <div className="right-0 top-[26px] m-0">
            <div className="prose dark:prose-invert">
              <button onClick={handleButtonClick}>Chọn file</button>
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
              />
              <p></p>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
              />
              <p></p>
              <button onClick={handleSubmit}>Submit</button>
              {error && (
                <div style={{ color: 'red' }}>
                  <h3>Error:</h3>
                  <p>{error}</p>
                </div>
              )}
              {message && (
                <div style={{ color: 'green' }}>
                  <h3>Success:</h3>
                  <p>{message}</p>
                </div>
              )}
              {fileContent && (
                <div>
                  <h3>File Content:</h3>
                  <pre>{JSON.stringify(fileContent.slice(fileContent.length - 3, fileContent.length), null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;