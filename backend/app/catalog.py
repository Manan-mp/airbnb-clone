"""Static catalogue values shared by the API and the seed."""

CATEGORIES = [
    {"key": "beach", "label": "Beachfront", "icon_key": "waves"},
    {"key": "mountains", "label": "Mountains", "icon_key": "mountain"},
    {"key": "cabins", "label": "Cabins", "icon_key": "tent"},
    {"key": "lakefront", "label": "Lakefront", "icon_key": "droplets"},
    {"key": "countryside", "label": "Countryside", "icon_key": "trees"},
    {"key": "amazing_views", "label": "Amazing views", "icon_key": "eye"},
    {"key": "luxe", "label": "Luxe", "icon_key": "gem"},
    {"key": "city", "label": "City stays", "icon_key": "building"},
    {"key": "treehouse", "label": "Treehouses", "icon_key": "tree-pine"},
    {"key": "trending", "label": "Trending", "icon_key": "flame"},
]
CATEGORY_KEYS = {c["key"] for c in CATEGORIES}
ROOM_TYPES = {"entire_home", "private_room", "shared_room"}
PROPERTY_TYPES = ["house", "apartment", "villa", "cabin", "farm_stay", "guest_house", "treehouse", "room"]

# City centres used when a host leaves lat/lng blank (lowercase city -> lat, lng).
CITY_CENTRES = {
    "goa": (15.4909, 73.8278),
    "manali": (32.2396, 77.1887),
    "udaipur": (24.5854, 73.7125),
    "jaipur": (26.9124, 75.7873),
    "alleppey": (9.4981, 76.3388),
    "mumbai": (19.0760, 72.8777),
    "rishikesh": (30.0869, 78.2676),
    "coorg": (12.3375, 75.8069),
    "delhi": (28.6139, 77.2090),
    "bengaluru": (12.9716, 77.5946),
    "shimla": (31.1048, 77.1734),
}
