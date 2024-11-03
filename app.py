from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import os

# Generate a random secret key
app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://admin:Divyagnan#20@snakegamedb.chaky22e26ll.ap-south-1.rds.amazonaws.com/snakegame'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Score(db.Model):
    user = db.Column(db.String(16), primary_key=True)
    password = db.Column(db.String(16), nullable=False)
    best_score = db.Column(db.Integer, default=0)

    def __init__(self, user, password):
        self.user = user
        self.password = password

    def update_score(self, score):
        if score > self.best_score:
            self.best_score = score
            db.session.commit()


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            flash("Username and password are required!")
            return redirect(url_for('signup'))

        existing_user = Score.query.filter_by(user=username).first()
        if existing_user:
            flash("Username already exists!")
            return redirect(url_for('signup'))

        new_user = Score(user=username, password=password)
        db.session.add(new_user)
        db.session.commit()
        flash("Sign up successful! Please log in.")
        return redirect(url_for('login'))

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = Score.query.filter_by(user=username, password=password).first()
        if user:
            session['username'] = username
            return redirect(url_for('game'))
        else:
            flash("Invalid username or password!")

    return render_template('login.html')


@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('game'))
    return redirect(url_for('login'))


@app.route('/game')
def game():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')


@app.route('/update_score', methods=['POST'])
def update_score():
    if 'username' not in session:
        return redirect(url_for('login'))

    data = request.get_json()
    score = data.get('score')
    user = session['username']

    user_score = Score.query.filter_by(user=user).first()
    if user_score:
        user_score.update_score(score)  # Update score in the database if it's higher
    return '', 204


@app.route('/leaderboard')
def leaderboard():
    scores = Score.query.order_by(Score.best_score.desc()).limit(5).all()
    return render_template('leaderboard.html', scores=scores)


@app.route('/getbestscore', methods=['GET'])
def get_best_score():
    if 'username' not in session:
        return {"error": "Unauthorized"}, 401  # Return an error if not logged in

    user = session['username']
    user_score = Score.query.filter_by(user=user).first()

    if user_score:
        return {"best_score": user_score.best_score}, 200  # Return the best score
    else:
        return {"error": "User not found"}, 404  # Handle case where user is not found


@app.route('/logout')
def logout():
    session.pop('username', None)  # Remove user from session
    return redirect(url_for('login'))  # Redirect to login page


if __name__ == "__main__":
    app.run(debug=True)
