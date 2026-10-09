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
