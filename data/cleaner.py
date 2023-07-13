import json
import csv
import sys, os

def convert_json_to_csv(json_file, csv_file):
    with open(json_file, 'r') as file:
        data = json.load(file)

    keys_to_keep = ['PLAYERNAME', 'TEAM', 'IDFANGRAPHS', 'POS']
    renamed_keys = {'PLAYERNAME': 'name', 'TEAM': 'team', 'IDFANGRAPHS': 'fid', "POS": 'pos'}

    filtered_data = [obj for obj in data if 'IDFANGRAPHS' in obj]

    with open(csv_file, 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['name', 'team', 'pos', 'fid'])
        writer.writeheader()

        for obj in filtered_data:
            row = {renamed_keys[key]: obj[key] for key in keys_to_keep}
            writer.writerow(row)

# Example usage
json_file_path = "C:\\Users\\Robert\\Documents\\espnfb\\data\\mapping.json"
csv_file_path = "C:\\Users\\Robert\\Documents\\espnfb\\data\\output.csv"
convert_json_to_csv(json_file_path, csv_file_path)
