import requests, json

def fetch_api_data(url):
    try:
        # Send a GET request to the API endpoint
        response = requests.get(url)

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            print("Request successful!")
            # Parse the JSON response into a Python dictionary
            data = response.json()
            return data
        else:
            print(f"Request failed with status code: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None

if __name__=="__main__":
    with open("demonlist.json", "w") as f:
        output = {}
        demonlist = fetch_api_data("https://pointercrate.com/api/v2/demons/listed?limit=100")
        for i in demonlist:
            leveldata = fetch_api_data("/api/level/" + i["level_id"])
            id = leveldata["Meta"]["ID"]
            output[i["name"]] = leveldata["Meta"]["Name"]
            output[i["id"]] = id
            output[i["position"]] = i["position"]
            output[i["creator"]] = leveldata["Publisher"]["name"]
            output[i["verifyer"]] = leveldata["Meta"]["Name"]
            output[i["thumbnail"]] = i["thumbnail"]
            output[i["downloads"]] = leveldata["Meta"]["Name"]
            output[i["length"]] = leveldata["Meta"]["Length"]


