require 'jwt'

class User < ApplicationRecord
  validates_presence_of :username
  validates_uniqueness_of :username
  validates_format_of :username, with: /\A[a-zA-Z0-9\-\_\.]+\z/i

  # cf. https://github.com/rails/rails/blob/master/activemodel/lib/active_model/secure_password.rb
  has_secure_password

  JWT_ALG = 'HS256'
  JWT_SECRET = Rails.application.credentials.jwt_secret!

  class << self
    def find_by_token!(token)
      payload, header = JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALG })
      User.find_by!(username: payload.dig('data', 'username'))
    end
  end

  def generate_token
    payload = {
      data: { username: self.username },
      exp: (Time.now + 7.day).to_i
    }
    JWT.encode(payload, JWT_SECRET, JWT_ALG)
  end

  def to_response
    {
      username: self.username,
      authToken: self.generate_token
    }
  end
end
