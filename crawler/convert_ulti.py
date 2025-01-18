import html2text
import os
from tqdm import tqdm
import pandas as pd
import multiprocessing

def remove_duplicate_line(df):
    lines = []
    for idx, row in tqdm(df.iterrows()):
        lines_row = []
        for line in row['Content'].splitlines():
            if line in lines:
                continue
            else:
                lines_row.append(line)
                lines.append(line)
        df.at[idx, "Content"] = "\n".join(lines_row)
    return df


def read_files(directory_path):
    file_paths = []
    for root, dirs, files in os.walk(directory_path):
        for file_name in files:
            if file_name.endswith('.html') or file_name.endswith('.htm'):
                file_path = os.path.join(root, file_name)
                file_paths.append(os.path.abspath(file_path))
    return file_paths

def read_html_by_paths(file_path):
    contents = []
    h = html2text.HTML2Text(bodywidth=0)
    h.ignore_links = True
    h.ignore_images = True
    h.unicode_snob = True
    h.escape_snob = True
    with open(file_path, 'r', encoding='utf-8') as file:
        content = h.handle(file.read())
        contents.append(content)
    return contents

def parallel_processing(items, num_processes):
    with multiprocessing.Pool(num_processes) as pool:
        results = list(tqdm(pool.imap(read_html_by_paths, items), total=len(items)))
    return results