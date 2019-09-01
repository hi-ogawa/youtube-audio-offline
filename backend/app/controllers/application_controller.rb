class ApplicationController < ActionController::API
  before_action :authenticate_user_by_token!, only: [ :new_token, :show_data, :update_date ]

  def register
    attrs = params.permit([:username, :password, :password_confirmation])
    user = User.new(attrs)
    if !user.save
      return render status: 400, json: { errors: user.errors.messages }
    end
    render json: user.to_response
  end

  def login
    username, password = params.require([:username, :password])
    user = User.find_by(username: username)
    return head 400 if !user
    return head 400 if !user.authenticate(password)
    render json: user.to_response
  end

  def new_token
    render json: current_user.to_response
  end

  def show_data
    render json: current_user.data
  end

  def update_data
    current_user.update(data: request.body.read)
    head 200
  end

  protected

  def current_user
    @current_user ||= begin
      if request.authorization
        m = request.authorization.match(/Bearer (.*)/)
        if m && m[1]
          begin
            User.find_by_token!(m[1])
          rescue JWT::DecodeError
          end
        end
      end
    end
  end

  def authenticate_user_by_token!
    if !current_user
      head 401 # :unauthorized
    end
  end
end
