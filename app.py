from flask import Flask, render_template, jsonify, request
import zxcvbn
import hashlib
import requests

app = Flask(__name__)


@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze_password():
    """Analyze password strength using zxcvbn"""
    data = request.get_json()
    password = data.get('password', '')

    # Use zxcvbn to analyze password strength
    results = zxcvbn.zxcvbn(password)

    # Extract relevant information
    score = results['score']  # 0-4 scale
    crack_time = results['crack_times_display']['offline_slow_hashing_1e4_per_second']
    feedback = results['feedback']

    # Return analysis results
    return jsonify({
        'score': score,
        'crack_time': crack_time,
        'warning': feedback['warning'],
        'suggestions': feedback['suggestions']
    })


@app.route('/check_leak', methods=['POST'])
def check_leak():
    """Check if password has been leaked using HIBP API with k-anonymity"""
    data = request.get_json()
    password = data.get('password', '')

    # Calculate SHA-1 hash of the password
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]  # First 5 characters
    suffix = sha1_hash[5:]   # Remaining characters

    # Query HIBP API with only the first 5 characters
    url = f'https://api.pwnedpasswords.com/range/{prefix}'
    response = requests.get(url)

    # Check if the remaining hash is in the response
    is_compromised = False
    count = 0

    if response.status_code == 200:
        # Parse the response to find if our hash suffix exists
        hashes = (line.split(':') for line in response.text.splitlines())
        for hash_suffix, occurrence_count in hashes:
            if hash_suffix == suffix:
                is_compromised = True
                count = int(occurrence_count)
                break

    return jsonify({
        'compromised': is_compromised,
        'count': count
    })


@app.route('/generate_password')
def generate_password():
    """Generate a cryptographically strong random password"""
    import secrets
    import string

    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    # Combine all characters
    all_chars = lowercase + uppercase + digits + special_chars

    # Generate a 16-character password
    password = ''.join(secrets.choice(all_chars) for _ in range(16))

    return jsonify({'password': password})


if __name__ == '__main__':
    app.run(debug=True)
