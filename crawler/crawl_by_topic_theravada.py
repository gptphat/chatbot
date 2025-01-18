import pandas as pd
import requests
from bs4 import BeautifulSoup
import multiprocessing
from tqdm import tqdm
import logging
logging.basicConfig(
     filename='log_file_name.log',
     level=logging.DEBUG, 
     format= '[%(asctime)s] {%(lineno)d} %(levelname)s - %(message)s',
     datefmt='%H:%M:%S'
 )


cookies = {
    '_gid': 'GA1.2.885150792.1711551585',
    'comnu1': '',
    'cocat1': '',
    '_gat_gtag_UA_279617604_1': '1',
    '_ga_SXMHDHXBET': 'GS1.1.1711551584.5.1.1711552107.0.0.0',
    '_ga': 'GA1.2.1704871365.1701799011',
}

headers = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
}

#response = requests.get('https://theravada.vn/cac-tac-gia/thien-su-ottamasara/', cookies=cookies, headers=headers)

def read_file_html(url):
    try:
        response = requests.get(url, cookies=cookies, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        h1_text = soup.find('h1').get_text().strip()
        content = soup.find('div', "article-content clearfix").get_text().strip()
        if len(content.split()) < 100:
            logging.debug(f"Not content, {url}, {len(content.split())}")
            return None
        return {"q": h1_text,
                "a": content
               }
    except Exception as e:
        logging.error(f"error {e} {url}")
        pass
    return None

def getLinks(url):
    links = []
    try:
        response = requests.get(url, cookies=cookies, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        entry_titles = soup.find_all('h2', class_='entry-title')
        for entry_title in entry_titles:
            try:
                link = entry_title.a.get('href')
                links.append(link)
            except:
                print("get err")
                pass
    except:
        print("get htl")
        pass
    return links

def getLoopLink(url, link_full=[], num = 0):
    if num > 0:
        links = getLinks(f"{url}page/{num}")
    else:
        links = getLinks(url)
    if len(links) > 0:
        num = num + 1
        link_full.extend(links)
        return getLoopLink(url, link_full, num)
    return link_full

def parallel_processing_get_urls(items, num_processes):
    with multiprocessing.Pool(num_processes) as pool:
        results = list(tqdm(pool.imap(getLoopLink, items), total=len(items)))
    results = [x for x in results if x is not None]
    return results

def parallel_processing(items, num_processes):
    with multiprocessing.Pool(num_processes) as pool:
        results = list(tqdm(pool.imap(read_file_html, items), total=len(items)))
    results = [x for x in results if x is not None]
    return results

if __name__ == "__main__":
    df = pd.read_csv("therava.csv")
    urls = parallel_processing_get_urls(df['url'], 16)
    pd.DataFrame(urls, columns=["url"]).to_csv("all_links_theravada.csv", index=False)



    df = pd.read_csv("all_links_theravada.csv")
    contents = parallel_processing(df['url'].tolist(), 32)
    logging.info(f"all {len(contents)}")
    df = pd.DataFrame(contents).drop_duplicates()
    logging.info(f"final {df.shape}")
    df.to_csv("crawl_theravada_vn.csv", index=False)