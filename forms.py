from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField, DecimalField
from wtforms import DateField, TextAreaField, RadioField, FileField, HiddenField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional, NumberRange
from wtforms.validators import ValidationError
from datetime import date, timedelta
from config import Config

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=64)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[
        DataRequired(), 
        Length(min=Config.PASSWORD_MIN_LENGTH, message=f'Password must be at least {Config.PASSWORD_MIN_LENGTH} characters long')
    ])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(), 
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class LoanAmountForm(FlaskForm):
    loan_amount = DecimalField('Loan Amount ($)', validators=[
        DataRequired(),
        NumberRange(min=Config.MIN_LOAN_AMOUNT, max=Config.MAX_LOAN_AMOUNT,
                    message=f'Loan amount must be between ${Config.MIN_LOAN_AMOUNT:,.2f} and ${Config.MAX_LOAN_AMOUNT:,.2f}')
    ])
    loan_purpose = SelectField('Loan Purpose', validators=[DataRequired()], choices=[
        ('', 'Select a purpose'),
        ('business_expansion', 'Business Expansion'),
        ('working_capital', 'Working Capital'),
        ('equipment_purchase', 'Equipment Purchase'),
        ('real_estate', 'Commercial Real Estate'),
        ('refinance', 'Debt Refinancing'),
        ('startup', 'Startup Funding'),
        ('other', 'Other')
    ])
    submit = SubmitField('Continue')

class PersonalInfoForm(FlaskForm):
    full_name = StringField('Full Legal Name', validators=[DataRequired(), Length(max=120)])
    ssn = StringField('Social Security Number', validators=[DataRequired(), Length(min=9, max=11)])
    dob = DateField('Date of Birth', validators=[DataRequired()])
    
    address = StringField('Street Address', validators=[DataRequired(), Length(max=256)])
    city = StringField('City', validators=[DataRequired(), Length(max=64)])
    state = SelectField('State', validators=[DataRequired()], choices=[
        ('', 'Select State'),
        ('AL', 'Alabama'), ('AK', 'Alaska'), ('AZ', 'Arizona'), ('AR', 'Arkansas'),
        ('CA', 'California'), ('CO', 'Colorado'), ('CT', 'Connecticut'), ('DE', 'Delaware'),
        ('FL', 'Florida'), ('GA', 'Georgia'), ('HI', 'Hawaii'), ('ID', 'Idaho'),
        ('IL', 'Illinois'), ('IN', 'Indiana'), ('IA', 'Iowa'), ('KS', 'Kansas'),
        ('KY', 'Kentucky'), ('LA', 'Louisiana'), ('ME', 'Maine'), ('MD', 'Maryland'),
        ('MA', 'Massachusetts'), ('MI', 'Michigan'), ('MN', 'Minnesota'), ('MS', 'Mississippi'),
        ('MO', 'Missouri'), ('MT', 'Montana'), ('NE', 'Nebraska'), ('NV', 'Nevada'),
        ('NH', 'New Hampshire'), ('NJ', 'New Jersey'), ('NM', 'New Mexico'), ('NY', 'New York'),
        ('NC', 'North Carolina'), ('ND', 'North Dakota'), ('OH', 'Ohio'), ('OK', 'Oklahoma'),
        ('OR', 'Oregon'), ('PA', 'Pennsylvania'), ('RI', 'Rhode Island'), ('SC', 'South Carolina'),
        ('SD', 'South Dakota'), ('TN', 'Tennessee'), ('TX', 'Texas'), ('UT', 'Utah'),
        ('VT', 'Vermont'), ('VA', 'Virginia'), ('WA', 'Washington'), ('WV', 'West Virginia'),
        ('WI', 'Wisconsin'), ('WY', 'Wyoming'), ('DC', 'District of Columbia')
    ])
    zip_code = StringField('ZIP Code', validators=[DataRequired(), Length(min=5, max=10)])
    
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Phone Number', validators=[DataRequired(), Length(min=10, max=20)])
    
    gender = RadioField('Gender', validators=[DataRequired()], choices=[
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say')
    ])
    
    employment_status = SelectField('Employment Status', validators=[DataRequired()], choices=[
        ('', 'Select Status'),
        ('employed_full_time', 'Employed Full-Time'),
        ('employed_part_time', 'Employed Part-Time'),
        ('self_employed', 'Self-Employed'),
        ('unemployed', 'Unemployed'),
        ('retired', 'Retired'),
        ('student', 'Student'),
        ('other', 'Other')
    ])
    employer = StringField('Employer Name', validators=[Optional(), Length(max=120)])
    monthly_income = DecimalField('Monthly Net Income ($)', validators=[DataRequired(), NumberRange(min=0)])
    
    submit = SubmitField('Continue to Bank Verification')
    
    def validate_dob(self, field):
        today = date.today()
        age = today.year - field.data.year - ((today.month, today.day) < (field.data.month, field.data.day))
        if age < 18:
            raise ValidationError('You must be at least 18 years old to apply for a loan.')
        elif age > 100:
            raise ValidationError('Please enter a valid date of birth.')

class BankVerificationForm(FlaskForm):
    bank_name = StringField('Bank Name', validators=[DataRequired(), Length(max=120)])
    account_name = StringField('Account Holder Name', validators=[DataRequired(), Length(max=120)])
    account_number = StringField('Account Number', validators=[DataRequired(), Length(min=4, max=17)])
    routing_number = StringField('Routing Number', validators=[DataRequired(), Length(min=9, max=9)])
    account_type = SelectField('Account Type', validators=[DataRequired()], choices=[
        ('', 'Select Account Type'),
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('business_checking', 'Business Checking'),
        ('business_savings', 'Business Savings')
    ])
    plaid_metadata = HiddenField('Plaid Metadata')
    continue_btn = SubmitField('Continue to Document Upload')

class DocumentUploadForm(FlaskForm):
    id_front = FileField('Government ID (Front)', validators=[DataRequired()])
    id_back = FileField('Government ID (Back)', validators=[DataRequired()])
    paystub = FileField('Recent Paystub or Employment Letter', validators=[DataRequired()])
    utility_bill = FileField('Utility Bill (Optional)', validators=[Optional()])
    submit = SubmitField('Review Application')

class ApplicationReviewForm(FlaskForm):
    agree_terms = RadioField('I agree to the terms and conditions', 
                            validators=[DataRequired(message='You must agree to the terms and conditions')],
                            choices=[('yes', 'Yes, I agree')])
    submit = SubmitField('Submit Application')
