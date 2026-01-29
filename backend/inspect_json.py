
import json

def inspect():
    try:
        with open("debug_universal_data.json", "r") as f:
            data = json.load(f)
        
        print("Top level keys:", list(data.keys()))
        
        if "__DEFAULT_SCOPE__" in data:
            print("\nKeys in __DEFAULT_SCOPE__:")
            scope = data["__DEFAULT_SCOPE__"]
            print(list(scope.keys()))
            
            # Check for video detail related keys
            for key in scope.keys():
                if "video" in key.lower():
                    print(f"\nPotential match: {key}")
                    print(json.dumps(scope[key], indent=2)[:500]) # Print start of content
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
