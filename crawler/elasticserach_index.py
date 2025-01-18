from elasticsearch import Elasticsearch, helpers
import json
import pandas as pd
import hashlib


# Connect to Elasticsearch
es = Elasticsearch(['http://localhost:9200'])

Synonymous = {
  "tứ thánh đế": "tứ diệu đế",
  "bát chánh đạo": "bát chính đạo",
  "là như thế nào": "là gì",
  "như thế nào là": "là gì",
  "thế nào": "là gì",
  "kẻ nào": "ai",
  "tại sao": "sao",
  "bao giờ": "lúc nào",
  "lúc nào": "khi nào",
  "ra sao": "như thế nào",
  "vì sao": "tại sao",
  "người nào": "ai",
  "làm sao": "như thế nào",
  "đâu": "ở đâu",
}

BANG_XOA_DAU_FULL = str.maketrans(
    "ÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴáàảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ",
    "A"*17 + "D" + "E"*11 + "I"*5 + "O"*17 + "U"*11 + "Y"*5 + "a"*17 + "d" + "e"*11 + "i"*5 + "o"*17 + "u"*11 + "y"*5,
    chr(774) + chr(770) + chr(795) + chr(769) + chr(768) + chr(777) + chr(771) + chr(803) # 8 kí tự dấu dưới dạng unicode chuẩn D
)

def xoa_dau_full(txt: str) -> str:
    return txt.translate(BANG_XOA_DAU_FULL)

def es_create_index_if_not_exists(index, body={}):
    """Create the given ElasticSearch index and ignore error if it already exists"""
    try:
        es.indices.create(index, body=body)
    except Exception as e:
        print(e)

def calculate_md5(input_string):
    md5_hash = hashlib.md5()
    md5_hash.update(input_string.encode('utf-8'))
    return md5_hash.hexdigest()

def es_delete_index(index):
    """Create the given ElasticSearch index and ignore error if it already exists"""
    try:
        es.indices.delete(index)
    except Exception as e:
        print(e)

# Define the index name
qna = 'qna'
qna_remove_accents = 'qna_remove_accents'
qna_budsas = 'qna_budsas'
qna_theravada = 'qna_theravada'
logs = "logs-qna"

# es_delete_index(qna)
# es_delete_index(qna_remove_accents)
# es_delete_index(qna_budsas)
# es_delete_index(qna_theravada)
# es_delete_index(logs)

es_create_index_if_not_exists(index=qna)
es_create_index_if_not_exists(index=qna_remove_accents)
es_create_index_if_not_exists(index=qna_budsas)
es_create_index_if_not_exists(index=qna_theravada)
es_create_index_if_not_exists(index="logs-qna", body={
  "settings": {
    "index": {
      "sort.field": "timestamp",
      "sort.order": "desc" 
    }
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      }
    }
  }
})

def load_json(file_name):
    df = pd.read_json(file_name)
    return df.to_dict('records')

def load_csv(file_name):
    df = pd.read_csv(file_name).rename(columns={"Câu hỏi": "q", "Câu trả lời": "a"})
    return df.to_dict('records')

def replaceSynonymous(question: str):
  input = question.lower()
  # isChange = False
  for key in Synonymous:
    if key in input:
      # isChange = True
      input = input.replace(key, Synonymous[key])
  # if isChange:
  #    print(question, " input: ", input)
  return input

def create_data_db(file_name, index_name, is_remove_accents = False, need_qs = False, isjson=False):
    # Load data from the JSON file
    if isjson:
        data = load_json(file_name)
    else:
        data = load_csv(file_name)
    print(len(data))
    

    # Prepare the actions for bulk insert
    actions = []
    for document in data:
      # if len(actions) > 10 and index_name == qna:
      #   break
      document["source"] = file_name
      if need_qs:
        document['q_s'] = replaceSynonymous(document['q'])
      if is_remove_accents:
          document['q_o'] = document['q']
          document['q'] = xoa_dau_full(document['q'])
          document['a_o'] = document['a']
          document['a'] = xoa_dau_full(document['a'])
      actions.append({
              "_op_type": "index",
              "_index": index_name,
              "_type": "_doc",
              "_source": document,
              "_id" : document['id'] if "id" in document else calculate_md5(document['q'])
          })

    # Perform the bulk insert
    helpers.bulk(es, actions)

create_data_db("db.zip", qna, need_qs=True, isjson=True)
# create_data_db("data.zip", qna)

create_data_db("db.zip", qna_remove_accents, True, need_qs=True, isjson=True)
create_data_db("data_add.csv", qna_budsas)
# create_data_db("data_add.csv", qna_remove_accents, True, need_qs=True)

create_data_db("data.zip", qna_budsas)
create_data_db("data_theravada.zip", qna_theravada)

# Refresh the index to make the documents available for search immediately (optional)
es.indices.refresh(index=qna)
es.indices.refresh(index=qna_remove_accents)

# Close the Elasticsearch connection (optional)
es.transport.close()