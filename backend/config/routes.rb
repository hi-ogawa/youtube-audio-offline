Rails.application.routes.draw do
  controller 'application' do
    post 'register'
    post 'login'
    get 'new_token'
    get 'data', action: 'show_data'
    patch 'data', action: 'update_data'
  end
end
