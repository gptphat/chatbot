from bs4 import BeautifulSoup
import os
import html2text
import multiprocessing
from tqdm import tqdm
import pandas as pd
from convert_ulti import read_files 


def read_file_html(file_html):
    try:
        with open(file_html, "r", encoding="utf-8") as file:
            html_content = file.read()
        soup = BeautifulSoup(html_content, 'html.parser')
        h1_text = soup.find('h1').get_text().strip()
        div_text = soup.find('div', class_='entry-content clearfix')
        h = html2text.HTML2Text(bodywidth=0)
        h.ignore_links = True
        h.ignore_images = True
        h.unicode_snob = True
        h.escape_snob = True
        content = h.handle(div_text.decode()).strip()
        return {"Title": h1_text,
                "Content": content
               }
    except:
        pass
    return None
    
def parallel_processing(items, num_processes):
    with multiprocessing.Pool(num_processes) as pool:
        results = list(tqdm(pool.imap(read_file_html, items), total=len(items)))
    results = [x for x in results if x is not None]
    return results

if __name__ == "__main__":
    num_processes = 36
    directory_path = "./theravada.vn/theravada.vn"
    file_paths = read_files(directory_path)
    contents = parallel_processing(file_paths, num_processes)
    df = pd.DataFrame(contents).drop_duplicates()
    print(df.shape)
    #df = remove_duplicate_line(df)
    df.to_csv("theravada_vn.csv", index=False)