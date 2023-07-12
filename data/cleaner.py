
import csv

def filter_csv(file_path, output_file_path):
    # Open the input and output files with the appropriate encoding
    with open(file_path, 'r', encoding='utf-8-sig') as input_file, open(output_file_path, 'a', newline='', encoding='utf-8-sig') as output_file:
        reader = csv.DictReader(input_file)
        writer = csv.DictWriter(output_file, fieldnames=reader.fieldnames)
        
        # Iterate over each row in the input file
        for row in reader:
            pro_played_last = row['pro_played_last']
            # Check if the 'pro_played_last' value is 2023 or 2022
            if pro_played_last == '2023' or pro_played_last == '2022':
                writer.writerow(row)  # Write the row to the output file

    print("Filtered rows have been appended to the existing CSV file.")
    print("added to ", input_file_path)

# Example usage
input_file_path = 'register-master\data\people-f.csv'  # Path to your input CSV file
output_file_path = 'filtered.csv'  # Path to the existing CSV file you want to append to
#filter_csv(input_file_path, output_file_path)



import json

# Specify the path to the JSON file
json_file_path = "mapping.json"

# Specify the key to be deleted
key_to_delete = "FANTPROSNAME"

# Read the JSON file with the correct encoding
with open(json_file_path, "r", encoding="utf-8") as json_file:
    data = json.load(json_file)

count = 0
tot = 0
# Delete the specified key from each object
for obj in data["PLAYERIDMAP"]:
    if obj["ACTIVE"] == "N":
        count = count + 1
    tot = tot + 1
    if key_to_delete in obj:
        del obj[key_to_delete]

print(count/tot)
print(tot)

# Save the modified JSON back to the file
with open(json_file_path, "w", encoding="utf-8") as json_file:
    json.dump(data, json_file, indent=2, ensure_ascii=False)