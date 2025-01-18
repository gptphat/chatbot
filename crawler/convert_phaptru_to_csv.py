import pandas as pd
from convert_ulti import remove_duplicate_line, read_files, read_html_by_paths, parallel_processing


if __name__ == "__main__":
    num_processes = 36
    directory_path = "./savedpages/phaptru/www.phaptru.com"
    file_paths = read_files(directory_path)
    contents = parallel_processing(file_paths, num_processes)
    df = pd.DataFrame(contents, columns=["Content"]).drop_duplicates()
    df = remove_duplicate_line(df)
    df.to_csv("phaptru.csv", index=False)