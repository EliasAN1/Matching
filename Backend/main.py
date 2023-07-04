import time

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session

import random
import threading
from datetime import datetime
import pytz

import bcrypt

import sqlite3

import smtplib
from email.message import EmailMessage
import requests

app = Flask(__name__, static_folder='static')
app.secret_key = 'elias'
CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200/*"}}, supports_credentials=True)
# Configure session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 1200
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'

# Initialize session
Session(app)

salt = bcrypt.gensalt()


@app.route('/', methods=['POST', 'GET'])
def home():
  return 'Hello world!'


@app.route('/api/register-user', methods=['POST'])
def register():
  data = request.get_json()
  email = data['email'].lower()
  user = data['user']
  password = data['password']
  shouldlogin = data['login']
  password = bcrypt.hashpw(str(password).encode('utf-8'), salt)
  exists = []

  users_con = sqlite3.connect("users.db")
  users_cur = users_con.cursor()
  users_con.execute("PRAGMA case_sensitive_like = 1")

  email_exist = users_cur.execute("SELECT email FROM accounts WHERE email=?", (email,)).fetchone()
  user_exist = users_cur.execute("SELECT username FROM accounts WHERE username=?", (user,)).fetchone()
  if email_exist is not None:
    exists.append('Email')
  if user_exist is not None:
    exists.append('Username')

  if len(exists) == 1:
    users_con.close()
    return failed_s(f'{exists[0]} already exists', 200)
  elif len(exists) == 2:
    users_con.close()
    return failed_s('Email and Username already exists', 200)
  now = datetime.now(pytz.utc)
  cet = pytz.timezone('CET')
  cet_date = now.astimezone(cet)
  date = cet_date.strftime("%d/%m/%Y %H:%M:%S")
  # In need for error test to know how to handle it.
  try:
    if shouldlogin:
      logindate = date
    else:
      logindate = 'NaN'
    users_cur.execute(f'INSERT INTO accounts (email, username, password, register_date,'
                      f'last_login, last_pass_update, last_recovery, '
                      f'last_recovery_request, admin, image) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                      , (email, user, password, date, logindate, 'NaN', 'NaN', 'NaN', 'false',
                         'https://i.imgur.com/tdi3NGa.png'))
    users_con.commit()

  except sqlite3.IntegrityError:
    return failed_s('Unknown Error')

  users_con.close()
  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")

  try:
    db_cur.execute(f'CREATE TABLE i{user} (exercises TEXT, public BLOB)')
    db_con.commit()

  except sqlite3.OperationalError as e:
    print(e)
    db_con.close()
    return failed_s('Unknown error occurred')
  try:
    db_cur.execute(f'CREATE TABLE f{user} (Friends TEXT UNIQUE, state TEXT)')
    db_con.commit()
  except sqlite3.OperationalError as e:
    print(e)
    return failed_s('Unknwon error occurred')
  if shouldlogin:
    session['username'] = user
    session['logged_in'] = True
  db_con.close()
  return success("You have been registered successfully")


@app.route('/api/login-user', methods=['POST'])
def login():
  data = request.get_json()
  user = data['user']
  password = data['password']

  users_con = sqlite3.connect("users.db")
  users_cur = users_con.cursor()
  users_con.execute("PRAGMA case_sensitive_like = 1")

  now = datetime.now(pytz.utc)
  cet = pytz.timezone('CET')
  cet_date = now.astimezone(cet)
  date = cet_date.strftime("%d/%m/%Y %H:%M:%S")

  users_cur.execute('SELECT password FROM accounts WHERE username=?', (user,))
  result = users_cur.fetchone()
  users_cur.execute("UPDATE accounts SET last_login=? WHERE username=?", (date, user))
  users_con.commit()

  users_con.close()

  if result is None:
    return failed_s('This username is not registered', 200)
  saved_password = result[0]

  if bcrypt.checkpw(str(password).encode('utf-8'), saved_password):
    session['username'] = user
    session['logged_in'] = True
    return success('You have been logged in successfully')
  else:
    return success('You entered a wrong password')


@app.route('/api/logout-user', methods=['GET'])
def logout():
  if 'username' not in session:
    return success('You logged out successfully')
  session.pop('username')
  session.pop('logged_in')
  return success('You logged out successfully')


@app.route('/api/authenticate', methods=['GET'])
def authenticate():
  if session.get('logged_in'):
    db_con = sqlite3.connect("database.db")
    db_cur = db_con.cursor()
    db_con.execute("PRAGMA case_sensitive_like = 1")
    db_cur.execute(f'SELECT [To] FROM notifications WHERE [To]=? AND type=?', (session["username"], 'friendsNoty'))
    try:
      friendsNoty = str(len(db_cur.fetchall()[0]))
    except IndexError:
      friendsNoty = ''
    db_cur.execute(f"SELECT [To] FROM notifications WHERE [To]=? AND (type=? OR type=?)",
                   (session["username"], 'msg', 'msg_delivered'))
    try:
      msgNoty = len(db_cur.fetchall()[0])
    except IndexError:
      msgNoty = ''
    print([session["username"], friendsNoty, msgNoty])
    return success([session["username"], friendsNoty, msgNoty])
  else:
    return failed_s('Not logged in', 200)


@app.route('/api/authenticate-admin', methods=['GET'])
def authenticateAdmin():
  if session.get('logged_in'):
    users_con = sqlite3.connect("users.db")
    users_cur = users_con.cursor()
    users_con.execute("PRAGMA case_sensitive_like = 1")
    users_cur.execute('SELECT admin FROM accounts WHERE username=?', (session['username'],))
    isadmin = users_cur.fetchone()[0]
    if isadmin == 'true':
      users_cur.execute('SELECT email, username, register_date, last_login, last_pass_update,'
                        ' last_recovery, last_recovery_request, admin FROM accounts')
      rows = users_cur.fetchall()
      lists = []
      for row in rows:
        temp_list = []
        for data in row:
          temp_list.append(data)
        lists.append(temp_list)

      users_con.close()
      db_con = sqlite3.connect("database.db")
      db_cur = db_con.cursor()
      db_con.execute("PRAGMA case_sensitive_like = 1")
      for list in lists:
        username = list[1]
        try:
          res = db_cur.execute(f'SELECT * FROM i{username}')
          AllExercisesForOneUser = res.fetchall()

          list.append(AllExercisesForOneUser)
        except sqlite3.OperationalError as e:
          return failed_s('Unknown error occurred')
      return success(lists)
    else:
      users_con.close()
      return success('False')
  else:
    return failed_s('False', 200)


@app.route('/api/admin-modifications', methods=['POST'])
def adminmodifications():
  if session.get('logged_in'):
    pass
  else:
    return failed_s('False', 200)

  users_con = sqlite3.connect("users.db")
  users_cur = users_con.cursor()
  users_con.execute("PRAGMA case_sensitive_like = 1")

  users_cur.execute('SELECT admin FROM accounts WHERE username=?', (session['username'],))
  isadmin = users_cur.fetchone()[0]
  if isadmin == 'false':
    users_con.close()
    return success('False')

  data = request.get_json()
  user = data['user']
  kind = data['kind']
  newdata = data['data']
  if kind == 'exercise':
    users_con.close()
    db_con = sqlite3.connect("database.db")
    db_cur = db_con.cursor()
    db_con.execute("PRAGMA case_sensitive_like = 1")

    try:
      db_cur.execute(f'DROP TABLE e{str(newdata) + str(user)}')
      db_con.commit()
    except sqlite3.OperationalError as e:
      db_con.close()
      return failed_s(str(e))

    try:
      db_cur.execute(f'DELETE FROM i{str(user)} WHERE exercises="{newdata}"')
      db_con.commit()
    except sqlite3.OperationalError as e:
      db_con.close()
      return failed_s(str(e))
    try:
      db_cur.execute(f'DELETE FROM publicExercises WHERE exercise="{newdata}" AND by="{str(user)}"')
      db_con.commit()
    except sqlite3.OperationalError as e:
      print("reached", e)
      pass

    db_con.close()
    return success('This exercise have been deleted')
  elif kind == 'delete':
    db_con = sqlite3.connect("database.db")
    db_cur = db_con.cursor()
    db_con.execute("PRAGMA case_sensitive_like = 1")
    try:
      res = db_cur.execute(f'SELECT * FROM i{str(user)}')
      AllExercisesForOneUser = res.fetchall()
      for i in AllExercisesForOneUser:
        db_cur.execute(f'DROP TABLE e{str(i[0]) + user}')
        db_con.commit()
    except sqlite3.OperationalError:
      pass
    try:
      db_cur.execute(f'DROP TABLE i{str(user)}')
      db_con.commit()
      db_cur.execute(f'DROP TABLE f{str(user)}')
      db_con.commit()
    except sqlite3.OperationalError:
      pass
    db_con.close()
    users_cur.execute(f'DELETE FROM accounts WHERE username=?', (str(user),))
    users_con.commit()
    return success('User deleted successfully')
  else:
    if kind == 'password':
      newdata = bcrypt.hashpw(str(newdata).encode('utf-8'), salt)
    try:
      users_cur.execute(f'UPDATE accounts SET {kind}=? WHERE username=?', (newdata, str(user)))
      users_con.commit()
      users_con.close()
      return success(f'{kind} modified successfully!')
    except sqlite3.IntegrityError as e:
      users_con.rollback()
      users_con.close()
      return failed_s(f'This {kind} already exists!', 200)


@app.route('/api/addexercise-admin', methods=['POST'])
def addexercisetouser():
  if session.get('logged_in'):
    pass
  else:
    return failed_s('False', 200)

  users_con = sqlite3.connect("users.db")
  users_cur = users_con.cursor()
  users_con.execute("PRAGMA case_sensitive_like = 1")

  users_cur.execute('SELECT admin FROM accounts WHERE username=?', (session['username'],))
  isadmin = users_cur.fetchone()[0]
  if isadmin == 'false':
    users_con.close()
    return success('False')
  users_con.close()
  data = request.get_json()
  exercise_from = str(data['exerciseFrom'])
  exercise_to = str(data['exerciseTo'])
  exercise_name = str(data['exerciseName'])
  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")

  try:
    newtablename = 'e' + exercise_name + exercise_to
    existingtablename = 'e' + exercise_name + exercise_from
    db_cur.execute(f"CREATE TABLE {newtablename} AS SELECT * FROM {existingtablename}")
    db_con.commit()
  except sqlite3.OperationalError:
    db_con.close()
    return failed_s('This exercise name already exists for that user', 200)
  db_cur.execute(f'INSERT INTO i{exercise_to} (exercises) VALUES(?)', (exercise_name,))
  db_con.commit()

  db_con.close()
  return success('The exercise have been added successfully!')


@app.route('/api/save-data', methods=['POST'])
def save():
  if 'username' not in session:
    return failed_s('Your session has ended please login in again and your data will be saved!', 200)
  data = request.get_json()
  exercise_name = data['exercisename']
  questions_dict = data['questions']
  public = data['public']
  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")

  try:
    if public:
      db_cur.execute('INSERT INTO publicExercises (exercise, by) VALUES (?,?)', (exercise_name, session['username']))
    db_cur.execute(f'CREATE TABLE e{exercise_name + session["username"]} (question TEXT, question_order TEXT)')
    db_cur.execute(f'INSERT INTO i{session["username"]} (exercises, public) VALUES(?, ?)', (exercise_name, public))
    db_con.commit()
    for i in questions_dict:
      db_cur.execute(f'INSERT INTO e{exercise_name + session["username"]} '
                     f'(question, question_order) VALUES(?, ?)', (i['question'], i['questionOrder']))
      db_con.commit()
  except sqlite3.OperationalError as e:
    print(e)
    db_con.close()
    if str(e) == f'table e{exercise_name + session["username"]} already exists':
      return failed_s('The name of this exercise is already used, choose another one!', 200)
    else:
      return failed_s(str(e))
  db_con.close()
  return success('Exercise saved successfully')


@app.route('/api/getdata', methods=['GET'])
def getdata():
  if 'username' not in session:
    return failed_s('Your session has ended please login in again!', 200)

  lists = []
  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")

  try:
    res = db_cur.execute(f'SELECT * FROM i{session["username"]}')
  except sqlite3.OperationalError:
    db_con.close()
    return failed_s('You do not have saved exercise', 200)
  data = res.fetchall()
  for i in data:
    table = str(i[0])
    res = db_cur.execute(f'SELECT * FROM e{table + session["username"]}')
    questions = res.fetchall()
    if i[1] == 'True':
      state = 'Make private'
    else:
      state = 'Make public'
    lists.append([table, questions, state])
  db_con.close()
  return success(lists)


@app.route('/api/getallpublicdata', methods=['GET'])
def getallpublicdata():
  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")
  lists = []

  try:
    res = db_cur.execute(f'SELECT * FROM publicExercises')
  except sqlite3.OperationalError as e:
    db_con.close()
    print(e)
    return failed_s('Unknown error occurred', 500)
  exercises = res.fetchall()
  try:
    for i in exercises:
      res = db_cur.execute(f'SELECT * FROM e{i[0] + i[1]}')
      questions = res.fetchall()
      lists.append([i[1], i[0], questions])
  except sqlite3.OperationalError as e:
    db_con.close()
    print(e)
    return failed_s('Unknown error occurred', 500)
  db_con.close()
  return success(lists)


@app.route('/api/modify-data-privacy', methods=['POST'])
def modify_privacy():
  if 'username' not in session:
    return failed_s('Your session has ended please login again!', 200)

  data = request.get_json()
  exercise = data['exercisename']
  state = data['state']
  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")
  try:
    db_cur.execute(f'UPDATE i{session["username"]} SET public=? WHERE exercises=?', (state, exercise))
    if state == 'True':
      db_cur.execute('INSERT INTO publicExercises (exercise, by) VALUES (?,?)', (exercise, session['username']))
    else:
      db_cur.execute('DELETE FROM publicExercises WHERE exercise=? AND by=?', (exercise, session['username']))
    db_con.commit()
  except sqlite3.OperationalError:
    return failed_s('Unknown error occurred', 500)

  return success('The exercise got modified successfully!')


@app.route('/api/deletedata', methods=['POST'])
def delete_data():
  data = request.get_json()
  exersice_name = data['exercise_name']

  if 'username' not in session:
    return failed_s('Your session has ended please login in again!', 200)

  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")

  try:
    db_cur.execute(f'DROP TABLE e{exersice_name + session["username"]}')
    db_con.commit()
    db_cur.execute(f'DELETE FROM i{session["username"]} WHERE exercises="{exersice_name}"')
    db_con.commit()
  except sqlite3.OperationalError as e:
    db_con.close()
    return failed_s(str(e))

  try:
    db_cur.execute(f'DELETE FROM publicExercises WHERE exercise=? AND by=?', (exersice_name, session['username']))
    db_con.commit()
  except sqlite3.OperationalError:
    db_con.close()
    return failed_s('Unknown error occurred')
  db_con.close()
  return success('This exercise have been deleted')


@app.route('/api/modify-data', methods=['POST'])
def modify():
  data = request.get_json()
  exercise_name = data['exercisename']
  questions_dict = data['questions']

  if 'username' not in session:
    return failed_s('Your session has ended please login in again!', 200)

  db_con = sqlite3.connect("database.db")
  db_cur = db_con.cursor()
  db_con.execute("PRAGMA case_sensitive_like = 1")

  try:
    db_cur.execute(f'DROP TABLE e{exercise_name + session["username"]}')
    db_con.commit()
  except sqlite3.OperationalError:
    db_con.close()
    return failed_s('Failed to modify the exercise')

  try:
    db_cur.execute(f'CREATE TABLE e{exercise_name + session["username"]} (question TEXT, question_order TEXT)')
    db_con.commit()
    for i in questions_dict:
      db_cur.execute(
        f'INSERT INTO e{exercise_name + session["username"]} (question, question_order) VALUES(?, ?)',
        (i['question'], i['questionOrder']))
      db_con.commit()
  except sqlite3.OperationalError as e:
    db_con.close()
    if str(e) == f'table e{exercise_name + session["username"]} already exists':
      return failed_s('The name of this exercise is already used, choose another one!', 200)
    else:
      return failed_s(str(e))
  db_con.close()
  return success('Exercise modified successfully!')


@app.route('/api/update-pass', methods=['POST'])
def updatepass():
  if session.get('logged_in'):
    pass
  else:
    return failed_s('Not logged in', 200)
  data = request.get_json()
  password = data['password']

  secret_pass_uh = random.randint(100000, 1000000)

  secret_pass = bcrypt.hashpw(str(secret_pass_uh).encode('utf-8'), salt)

  con = sqlite3.connect('users.db')
  cur = con.cursor()

  cur.execute('SELECT password FROM accounts WHERE username=?', (session['username'],))
  password_db = cur.fetchone()[0]

  if not bcrypt.checkpw(str(password).encode('utf-8'), password_db):
    con.close()
    return failed_s('You have entered a wrong password', 200)
  cur.execute('SELECT email FROM accounts WHERE username=?', (session['username'],))
  email = cur.fetchone()[0]
  splitted_email = email.split("@")[0]

  try:
    cur.execute(f'INSERT INTO recovering (email, code, modkind, authemail) VALUES(?, ?, ?, ?)',
                (email, secret_pass, 'passwordupdate', splitted_email))
    con.commit()
  except sqlite3.IntegrityError:
    con.close()
    return success('Already tried')

  # Data for sending email
  sender_email = 'elias.croatia@gmail.com'
  receiver_email = f'{email}'
  subject = 'Reset Your Password'
  msg = EmailMessage()
  msg['From'] = sender_email
  msg['To'] = receiver_email
  msg['Subject'] = subject
  msg.set_content(f'''
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset password</title>
  <style>
    .wrapper {{
      height: 70vh;
    }}

    .container {{
      background: rgb(63, 63, 63);
    }}

    h1 {{
      text-align: center;
      color: wheat;
    }}

    p {{
      color: white;
      font-size: 17px;
      padding: 20px;
    }}

    #recovery-link {{
      text-decoration: none;
      color: wheat;
      padding: 2px;
      transition: 0.2s;
    }}

    #code {{
      font-size: 20px;
      font-weight: bolder;
      color: wheat;
    }}

    #expire {{
      color: red;
      font-size: 20px;
      text-align: center;
    }}

    #cancel {{
      color: rgb(216, 0, 0);
      text-decoration: none;
      transition: 0.2s;
    }}

    #cancel:hover {{
      color: red;
    }}

    #recovery-link:hover {{
      color: white;
    }}
  </style>
</head>

<body>
<div class="wrapper">
<div class="container">
  <h1>MATCHING QUESTIONS</h1>
  <p>Hello, we are happy that this email reached you. <br><br>
    Please enter this code in the link provided below: <span id="code">{secret_pass_uh}</span></p>
    <p> This is a link: <a href="https://matching-c70d4.web.app/{splitted_email}" id="recovery-link">Recovery link</a> </p>

    <p id="expire">The code will expire after 10 minutes!</p>

<p style="font-weight: bolder;">If it was not you who did this action please click
  <a href="https://matching-c70d4.web.app/{email.split("@")[0]}notme" id="cancel">Cancel recovery</a></p>
</div>
</div>

</body>

</html>
    ''', subtype='html')
  try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login('elias.croatia@gmail.com', 'jnqjvholnjtmqifq')
    server.send_message(msg)
    server.quit()
  except smtplib.SMTPAuthenticationError as e:
    con.close()
    return failed_s(str(e))
  now = datetime.now(pytz.utc)
  cet = pytz.timezone('CET')
  cet_date = now.astimezone(cet)
  date = cet_date.strftime("%d/%m/%Y %H:%M:%S")

  cur.execute("UPDATE accounts SET last_recovery_request=? WHERE email=?", (date, email))
  con.commit()
  con.close()
  threading.Timer(600, clear_recovery, args=(email,)).start()
  return success('Email has been sent successfully!')


@app.route('/api/recover', methods=['POST'])
def retrieve():
  data = request.get_json()
  email = data['email']
  splitted_email = email.split("@")[0]
  data_kind = data['dataToRetrieve']

  secret_pass_uh = random.randint(100000, 1000000)

  secret_pass = bcrypt.hashpw(str(secret_pass_uh).encode('utf-8'), salt)

  con = sqlite3.connect('users.db')
  cur = con.cursor()
  try:
    cur.execute(f'INSERT INTO recovering (email, code, modkind, authemail) VALUES(?, ?, ?, ?)',
                (email, secret_pass, data_kind, splitted_email))
    con.commit()
  except sqlite3.IntegrityError:
    con.close()
    return success('Already tried')

  # Data for sending email
  sender_email = 'elias.croatia@gmail.com'
  receiver_email = f'{email}'
  if data_kind == 'password':
    subject = 'Reset Your Password'
  else:
    subject = 'Get Your Username'

  msg = EmailMessage()
  msg['From'] = sender_email
  msg['To'] = receiver_email
  msg['Subject'] = subject
  msg.set_content(f'''
        <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset password</title>
      <style>
        .wrapper {{
          height: 70vh;
        }}

        .container {{
          background: rgb(63, 63, 63);
        }}

        h1 {{
          text-align: center;
          color: wheat;
        }}

        p {{
          color: white;
          font-size: 17px;
          padding: 20px;
        }}

        #recovery-link {{
          text-decoration: none;
          color: wheat;
          padding: 2px;
          transition: 0.2s;
        }}

        #code {{
          font-size: 20px;
          font-weight: bolder;
          color: wheat;
        }}

        #expire {{
          color: red;
          font-size: 20px;
          text-align: center;
        }}

        #cancel {{
          color: rgb(216, 0, 0);
          text-decoration: none;
          transition: 0.2s;
        }}

        #cancel:hover {{
          color: red;
        }}

        #recovery-link:hover {{
          color: white;
        }}
      </style>
    </head>

    <body>
    <div class="wrapper">
    <div class="container">
      <h1>MATCHING QUESTIONS</h1>
      <p>Hello, we are happy that this email reached you. <br><br>
        Please enter this code in the link provided below: <span id="code">{secret_pass_uh}</span></p>
        <p> This is a link: <a href="https://matching-c70d4.web.app/{splitted_email}" id="recovery-link">Recovery link</a></p>

        <p id="expire">The code will expire after 10 minutes!</p>

    <p style="font-weight: bolder;">If it was not you who did this action please click
      <a href="https://matching-c70d4.web.app/{email.split("@")[0]}notme" id="cancel">Cancel recovery</a></p>
    </div>
    </div>

    </body>

    </html>
        ''', subtype='html')
  try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login('elias.croatia@gmail.com', 'jnqjvholnjtmqifq')
    server.send_message(msg)
    server.quit()
  except smtplib.SMTPAuthenticationError as e:
    con.close()
    return failed_s(str(e))

  now = datetime.now(pytz.utc)
  cet = pytz.timezone('CET')
  cet_date = now.astimezone(cet)
  date = cet_date.strftime("%d/%m/%Y %H:%M:%S")

  cur.execute("UPDATE accounts SET last_recovery_request=? WHERE email=?", (date, email))
  con.commit()
  con.close()
  threading.Timer(600, clear_recovery, args=(email,)).start()
  return success('Email has been sent successfully!')


@app.route('/api/auth-recovery', methods=['POST'])
def auth_recovery():
  data = request.get_json()
  code = data['code']
  email = data['email']
  con = sqlite3.connect('users.db')
  cur = con.cursor()
  code_db = ''
  email_db = ''
  data_kind = ''

  try:
    cur.execute('SELECT code FROM recovering WHERE authemail=?', (email,))
    try:
      code_db = cur.fetchone()[0]
    except TypeError:
      con.close()
      return failed_s('Something went wrong')
    cur.execute('SELECT email FROM recovering WHERE authemail=?', (email,))
    try:
      email_db = cur.fetchone()[0]
    except TypeError:
      con.close()
      return failed_s('Something went wrong')
    cur.execute('SELECT modkind FROM recovering WHERE authemail=?', (email,))
    try:
      data_kind = cur.fetchone()[0]
    except TypeError:
      con.close()
      return failed_s('Something went wrong')
  except sqlite3.OperationalError:
    pass
  if bcrypt.checkpw(str(code).encode('utf-8'), code_db):
    cur.execute(f'DELETE FROM recovering WHERE authemail=?', (email,))
    con.commit()
    if data_kind == 'username':
      cur.execute('SELECT username FROM accounts WHERE email=?', (email_db,))
      user = cur.fetchone()[0]
      now = datetime.now(pytz.utc)
      cet = pytz.timezone('CET')
      cet_date = now.astimezone(cet)
      date = cet_date.strftime("%d/%m/%Y %H:%M:%S")

      cur.execute("UPDATE accounts SET last_recovery=? WHERE email=?", (date, session['email']))
      con.commit()
      con.close()
      return success(f'{user}')
    else:
      session['auth'] = True
      session['email'] = email_db
      con.close()
      return success(f'User entered correct code')
  else:
    con.close()
    return failed_s('User entered wrong code', 200)


@app.route('/api/update', methods=['POST'])
def update():
  if 'email' not in session:
    return failed_s('Your session has ended please login in again!', 200)

  password = request.get_json()['password']
  password = bcrypt.hashpw(str(password).encode('utf-8'), salt)

  con = sqlite3.connect('users.db')
  cur = con.cursor()

  try:
    cur.execute("UPDATE accounts SET password=? WHERE email=?", (password, session['email']))
    con.commit()
    now = datetime.now(pytz.utc)
    cet = pytz.timezone('CET')
    cet_date = now.astimezone(cet)
    date = cet_date.strftime("%d/%m/%Y %H:%M:%S")
    cur.execute("UPDATE accounts SET last_recovery=? WHERE email=?", (date, session['email']))
    con.commit()
    cur.execute("UPDATE accounts SET last_pass_update=? WHERE email=?", (date, session['email']))
    con.commit()
  except sqlite3.Error:
    con.close()
    return failed_s('Something went wrong, please try again', 200)
  con.close()
  return success('Password is updated!')


@app.route('/api/pathcheck', methods=['POST'])
def pathcheck():
  email = request.get_json()['email']
  con = sqlite3.connect('users.db')
  cur = con.cursor()
  cur.execute('SELECT email FROM recovering WHERE authemail=?', (email,))
  email_db = cur.fetchone()
  con.close()
  if email_db is None:
    return failed_s('No such recovery', 200)
  return success('This email is in recovery stage')


@app.route('/api/notme', methods=['POST'])
def notme():
  email = request.get_json()['email']
  con = sqlite3.connect('users.db')
  cur = con.cursor()
  cur.execute('SELECT email FROM recovering WHERE authemail=?', (email,))
  email_db = cur.fetchone()
  con.close()
  if email_db is None:
    return failed_s('No such recovery', 200)

  clear_recovery(email_db[0])
  return success('The recovery canceled successfully!')


@app.route('/api/user', methods=['GET'])
def get_profile_data():
  if 'username' not in session:
    return success('You session has ended please login again!')
  users_con = sqlite3.connect('users.db')
  users_cur = users_con.cursor()
  users_con.execute("PRAGMA case_sensitive_like = 1")
  users_cur.execute('SELECT email, username, register_date, last_login, last_pass_update,'
                    ' last_recovery, last_recovery_request, image FROM accounts WHERE username=?',
                    (session['username'],))
  rows = users_cur.fetchall()
  lists = []
  for row in rows:
    temp_list = []
    for data in row:
      temp_list.append(data)
    lists.append(temp_list)

  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")
  db_cur.execute(f'SELECT Friends, state FROM f{session["username"]} WHERE state=? OR state=?', ('friend', 'blocked_self',))
  friends = db_cur.fetchall()
  friends_list_pic = []
  print(friends)
  for friend in friends:
    users_cur.execute('SELECT image FROM accounts WHERE username=?', (friend[0],))
    url = users_cur.fetchone()
    if not url:
      db_cur.execute(f'DELETE FROM f{session["username"]} WHERE Friends=?', (friend[0],))
      db_con.commit()
    else:
      friends_list_pic.append([friend[0], friend[1], url])
  lists.append(friends_list_pic)
  db_con.close()
  users_con.close()
  return success(lists)


@app.route('/api/visit-profile', methods=['POST'])
def get_visit_profile_data():
  logged_in_user = ''
  if 'username' in session:
    logged_in_user = session["username"]
  user = request.get_json()['user']
  users_con = sqlite3.connect('users.db')
  users_cur = users_con.cursor()
  users_con.execute("PRAGMA case_sensitive_like = 1")
  users_cur.execute('SELECT username, register_date, last_login, image FROM accounts WHERE username=?',
                    (user,))
  rows = users_cur.fetchall()
  if not rows:
    return success('No such user')

  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")
  db_cur.execute(f'SELECT state FROM f{user} WHERE Friends=?', (session["username"],))
  state = db_cur.fetchone()

  if state is not None and state[0] == 'blocked_not_self':
    return success("You have blocked this user, you can go to your account and unblock him!")
  elif state is not None and state[0] == 'blocked_self':
    return success("This user have blocked you!")

  lists = []
  temp_list = []
  for data in rows[0]:
    temp_list.append(data)
  lists.append(temp_list)



  db_cur.execute(f'SELECT Friends, state FROM f{user}')
  friends = db_cur.fetchall()



  friends_list_pic = []

  for friend in friends:
    if friend[1] == 'friend' or friend[0] == logged_in_user:
      users_cur.execute('SELECT image FROM accounts WHERE username=?', (friend[0],))
      url = users_cur.fetchone()
      if not url:
        db_cur.execute(f'DELETE FROM f{user} WHERE Friends=?', (friend[0],))
        db_con.commit()
      else:
        friends_list_pic.append([friend[0], str(url)[2:-3], friend[1]])
  reached_self = False
  if logged_in_user:
    for i, friend in enumerate(friends_list_pic):
      reached = False
      state = None
      if friend[0] == logged_in_user:
        db_cur.execute(f'SELECT state FROM f{session["username"]} WHERE Friends=?', (user,))
        state = db_cur.fetchone()
        reached = True
      elif friend[2] == 'friend' and friend[0] != logged_in_user:
        db_cur.execute(f'SELECT state FROM f{session["username"]} WHERE Friends=?', (friend[0],))
        state = db_cur.fetchone()
        reached = True

      if not state and reached:
        friends_list_pic[i][2] = 'not-relatable'
      elif state and reached:
        friends_list_pic[i][2] = str(state)[2:-3]
  else:
    for index, friend in enumerate(friends_list_pic):
      friends_list_pic[index][2] = ''
  lists.append(friends_list_pic)

  db_cur.execute(f'SELECT exercises FROM i{user} WHERE public=?', ('True',))
  exercises_name = db_cur.fetchall()
  exercises = []
  for exercise_name in exercises_name:
    db_cur.execute(f'SELECT * FROM e{str(exercise_name[0]) + user}')
    questions = db_cur.fetchall()
    exercises.append([exercise_name, questions])

  lists.append(exercises)

  db_con.close()
  users_con.close()
  return success(lists)


@app.route('/api/upload-image', methods=['POST'])
def upload_image():
  if 'image' not in request.files:
    return failed_s('Error occured during request, please try again', 200)

  image = request.files['image']

  if image.filename == '':
    return failed_s('You are not logged in', 200)

  headers = {'Authorization': 'Client-ID 13d68384e6097d9'}
  url = 'https://api.imgur.com/3/upload'

  files = {'image': image}
  response = requests.post(url, headers=headers, files=files)

  if response.status_code == 200:
    data = response.json()
    image_url = data['data']['link']
    con = sqlite3.connect('users.db')
    cur = con.cursor()
    cur.execute("PRAGMA case_sensitive_like = 1")

    cur.execute('UPDATE accounts SET image=? WHERE username=?', (image_url, image.filename))
    con.commit()
    con.close()
    return success(f'Image saved successfully : {image_url}')
  else:
    return failed_s('Error occured during request, please try again', 200)


@app.route('/api/get-users', methods=['GET'])
def get_users():
  if 'username' not in session:
    return success('Your session has ended please login again!')
  users_con = sqlite3.connect('users.db')
  users_cur = users_con.cursor()
  users_cur.execute("PRAGMA case_sensitive_like = 1")
  users_cur.execute('SELECT username, image FROM accounts')
  users = users_cur.fetchall()
  users_con.close()
  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")
  db_cur.execute(f"SELECT Friends FROM f{session['username']} WHERE state=?", ('friend',))
  user_friends = db_cur.fetchall()
  db_cur.execute(f"SELECT Friends FROM f{session['username']} WHERE state=?", ('pending_request',))
  user_pr = db_cur.fetchall()
  db_cur.execute(f"SELECT Friends FROM f{session['username']} WHERE state=?", ('pending_acceptance',))
  user_pa = db_cur.fetchall()
  db_cur.execute(f"SELECT Friends FROM f{session['username']} WHERE state=? OR state=?", ('blocked_self', 'blocked_not_self'))
  user_bl = db_cur.fetchall()
  db_con.close()
  for i in range(0, 4):
    temp_list = []
    if i == 0:
      for friend in user_friends:
        temp_list.append(str(friend[0]))
      user_friends = temp_list
    elif i == 1:
      for request in user_pr:
        temp_list.append(str(request[0]))
      user_pr = temp_list
    elif i == 2:
      for accept in user_pa:
        temp_list.append(str(accept[0]))
      user_pa = temp_list
    else:
      for blocked in user_bl:
        for user in users:
          if user[0] == blocked[0]:
            users.remove(user)

  data = [users, user_friends, user_pr, user_pa]
  return success(data)


@app.route('/api/manage-friend', methods=['POST'])
def friend_manage():
  if 'username' not in session:
    return success('Your session has ended please login again!')
  user_to_add = request.get_json()['user']
  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")
  users_list = [session["username"], user_to_add[0]]
  users_list.sort()
  try:
    def delete():
      db_cur.execute(f'DELETE FROM f{user_to_add[0]} WHERE Friends=?', (session['username'],))
      db_con.commit()
      db_cur.execute(f'DELETE FROM f{session["username"]} WHERE Friends=?', (user_to_add[0],))
      db_con.commit()
      db_cur.execute(f'SELECT chatId FROM groups WHERE user_alpha=? AND user_Beta=?', ((users_list[0], users_list[1],)))
      ids = db_cur.fetchone()
      if ids:
        db_cur.execute(f'DELETE FROM notifications WHERE chatId=?', (int(ids[0]),))
        db_con.commit()
      return True

    if request.get_json()['state'] == 'reject':
      delete()
      db_con.close()
      return success('You have rejected this user successfully!')
    elif request.get_json()['state'] == 'block':
      delete()
      db_cur.execute(f'INSERT INTO f{user_to_add[0]} (Friends, state) VALUES (?,?)', (session['username'], 'blocked_not_self', ))
      db_con.commit()
      db_cur.execute(f'INSERT INTO f{session["username"]} (Friends, state) VALUES (?,?)', (user_to_add[0],'blocked_self', ))
      db_con.commit()
      db_con.close()
      return success('You have blocked this user successfully!')
    elif request.get_json()['state'] == 'unblock':
      delete()
      db_con.close()
      return success('You have unblocked this user successfully!')
    elif user_to_add[2] == 'not-related':
      db_cur.execute(f'INSERT INTO f{user_to_add[0]} (Friends, state) VALUES (?, ?)',
                     (session['username'], 'pending_acceptance'))
      db_con.commit()
      db_cur.execute(f'INSERT INTO f{session["username"]} (Friends, state) VALUES (?, ?)',
                     (user_to_add[0], 'pending_request'))
      db_con.commit()
      db_con.close()
      return success('You have sent a friend request to this user successfully!')
    elif user_to_add[2] == 'requested':
      delete()
      db_con.close()
      return success('You have cancelled the request to this user successfully!')
    elif user_to_add[2] == 'friend':
      delete()
      db_con.close()
      return success('You have removed this friend successfully!')
    elif user_to_add[2] == 'pending-acceptance':
      db_cur.execute(f'SELECT Friends FROM f{session["username"]} WHERE Friends=?', (user_to_add[0],))
      user = db_cur.fetchone()
      if not user:
        db_con.close()
        return success('Looks like this request has been canceled')

      db_cur.execute(f'UPDATE f{user_to_add[0]} SET state=? WHERE Friends=?', ('friend', session['username'],))
      db_con.commit()
      db_cur.execute(f'UPDATE f{session["username"]} SET state=? WHERE Friends=?', ('friend', user_to_add[0],))
      db_con.commit()
      db_cur.execute(f'SELECT chatId FROM groups WHERE user_alpha=? AND user_Beta=?', ((users_list[0], users_list[1],)))
      ids = db_cur.fetchone()
      if not ids:
        db_cur.execute(f'INSERT INTO groups (user_alpha, user_beta) VALUES (?,?)', (users_list[0], users_list[1],))
        db_con.commit()
      db_con.close()
      return success('You have accepted this friend successfully!')
  except sqlite3.IntegrityError as e:
    db_con.close()
    return failed_s('Synchronization error', 200)


@app.route('/api/chat', methods=['GET'])
def chat():
  if 'username' not in session:
    return success('Your session has ended please login again!')
  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")

  users_con = sqlite3.connect('users.db')
  users_cur = users_con.cursor()
  users_cur.execute("PRAGMA case_sensitive_like = 1")

  db_cur.execute(f'SELECT user_alpha, user_beta, chatId FROM groups WHERE user_alpha=? or user_beta=?',
                 (session["username"], session["username"],))
  chats_db = db_cur.fetchall()
  db_cur.execute(f'SELECT Friends FROM f{session["username"]} WHERE state=?', ('friend',))
  friends = db_cur.fetchall()
  list_to_remove = []
  for chat in chats_db:
    found = False
    for friend in friends:
      if friend[0] not in chat:
        pass
      else:
        found = True
        break
    if not found: list_to_remove.append(chat)

  for chat in list_to_remove:
    chats_db.remove(chat)

  friends_already_chatted_with = []
  chats = []

  for chat in chats_db:
    db_cur.execute(f'SELECT message, time, by, read FROM messages WHERE chatId=?', (int(chat[2]),))
    msgs = db_cur.fetchall()
    if session["username"] == chat[0]:
      users_cur.execute(f'SELECT image FROM accounts WHERE username=?', (chat[1],))
      image = users_cur.fetchone()
      chats.append([chat[0], chat[1], msgs, image])
      friends_already_chatted_with.append(chat[1])
    else:
      users_cur.execute(f'SELECT image FROM accounts WHERE username=?', (chat[0],))
      image = users_cur.fetchone()
      chats.append([chat[1], chat[0], msgs, image])
      friends_already_chatted_with.append(chat[0])

  for index, friend in enumerate(friends):
    if friend[0] in friends_already_chatted_with:
      pass
    else:
      users_cur.execute(f'SELECT image FROM accounts WHERE username=?', (friend[0],))
      image = users_cur.fetchone()
      chats.append([session["username"], friend[0], [], image])
  return success(chats)


@app.route('/api/update-chat')
def update_chat():
  if 'username' not in session:
    return success('Your session has ended please login again!')
  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")

  db_cur.execute(f'SELECT chatId FROM notifications WHERE [To]=? AND type="msg"', (session['username'],))
  chatIds = db_cur.fetchall()
  if not chatIds:
    return success('No new messages')

  chats = []
  for id in chatIds:
    db_cur.execute(f'SELECT user_alpha, user_beta FROM groups WHERE chatId=?', (int(id[0]),))
    users = db_cur.fetchall()
    db_cur.execute(f'SELECT message, time, by, read FROM messages WHERE chatId=?', (int(id[0]),))
    msgs = db_cur.fetchall()
    if session["username"] == users[0][0]:
      chats.append([users[0][0], users[0][1], msgs])
    else:
      chats.append([users[0][1], users[0][0], msgs])
    db_cur.execute(f'UPDATE notifications SET type="msg_delivered" WHERE [To]=? AND type="msg"', (session['username'],))
    db_con.commit()
  db_con.close()
  return success(chats)


@app.route('/api/seen', methods=['POST'])
def seen():
  user = request.get_json()['userThatSent']
  if 'username' not in session:
    return success('Your session has ended please login again!')
  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")
  users_list = [session["username"], user]
  users_list.sort()

  db_cur.execute(f'SELECT chatId FROM groups WHERE user_alpha=? AND user_beta=?', (users_list[0], users_list[1]))
  ids = db_cur.fetchone()
  if not ids:
    return failed_s('Unplanned error occurred')
  db_cur.execute(f'UPDATE messages SET read=? WHERE by=? AND chatId=?', ('true', user, int(ids[0])))
  db_con.commit()
  db_cur.execute(f'DELETE FROM notifications WHERE [TO]=? AND chatId=?', (session["username"], int(ids[0])))
  db_con.commit()
  return success('Updated')


@app.route('/api/send-mess', methods=['POST'])
def sendmsg():
  data = request.get_json()
  if 'username' not in session:
    return success('Your session has ended please login again!')
  msg = data['msg']
  now = datetime.now(pytz.utc)
  cet = pytz.timezone('CET')
  cet_date = now.astimezone(cet)
  date = cet_date.strftime("%d/%m/%Y %H:%M:%S")
  receiver = data['receiver']
  users_list = [session["username"], receiver]
  users_list.sort()
  db_con = sqlite3.connect('database.db')
  db_cur = db_con.cursor()
  db_cur.execute("PRAGMA case_sensitive_like = 1")

  db_cur.execute(f'SELECT state FROM f{session["username"]} WHERE Friends=?', ((receiver,)))
  state = db_cur.fetchone()
  if str(state) != "('friend',)":
    db_con.close()
    return success('You are no longer friend with this user')

  db_cur.execute(f'SELECT chatId FROM groups WHERE user_alpha=? AND user_Beta=?', ((users_list[0], users_list[1],)))
  ids = db_cur.fetchone()

  if not ids:
    db_cur.execute(f'INSERT INTO groups (user_alpha, user_beta) VALUES (?,?)', (users_list[0], users_list[1],))
    db_con.commit()
    db_cur.execute(f'SELECT chatId FROM groups WHERE user_alpha=? AND user_Beta=?', ((users_list[0], users_list[1],)))
    ids = db_cur.fetchone()

  db_cur.execute(f'INSERT INTO messages (message, time, by, read, chatId) VALUES (?,?,?,?,?)',
                 (msg, date, session["username"], 'false', int(ids[0]),))
  db_con.commit()
  try:
    db_cur.execute(f'INSERT INTO notifications ([To], type, chatId) VALUES (?,?,?)', (receiver, 'msg', int(ids[0]),))
    db_con.commit()
  except sqlite3.IntegrityError as e:
    db_cur.execute(f'UPDATE notifications SET type=? WHERE [To]=? AND chatId=? ', ('msg', receiver, int(ids[0]),))
    db_con.commit()
    pass

  db_con.close()
  return success('Message send successfully')


def failed_s(why, status=500):
  response = jsonify({'message': why})
  response.status_code = status
  response.headers.add('Access-Control-Allow-Headers',
                       "Origin, X-Requested-With, Content-Type, Accept, x-auth")
  response.headers['Content-Type'] = 'application/json'
  response.headers['charset'] = 'UTF-8'
  response.headers['x-content-type-options'] = 'nosniff'  # Add 'x-content-type-options' header
  return response


def success(message):
  response = jsonify({'message': message})
  response.status_code = 200
  response.headers.add('Access-Control-Allow-Headers',
                       "Origin, X-Requested-With, Content-Type, Accept, x-auth")
  response.headers['Content-Type'] = 'application/json'
  response.headers['charset'] = 'UTF-8'
  response.headers['x-content-type-options'] = 'nosniff'  # Add 'x-content-type-options' header

  return response


def clear_recovery(email):
  con = sqlite3.connect('users.db')
  cur = con.cursor()
  try:
    cur.execute(f'DELETE FROM recovering WHERE email=?', (email,))
    con.commit()
  except sqlite3.Error:
    pass
  con.close()


def time_calculator(i):
  time.sleep(1)
  return i + 1


if __name__ == "__main__":
  app.run()
