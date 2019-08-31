require "test_helper"

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  test 'POST register' do
    # basic case
    payload = {
      username: 'xxxx1',
      password: 'abcdefg',
      password_confirmation: 'abcdefg'
    }
    post register_path, params: payload, as: :json
    assert_equal response.status, 200
    assert response.header['content-type'].match('application/json')
    assert User.find_by(username: 'xxxx1')
    assert_equal JSON.parse(response.body).dig('username'), 'xxxx1'
    assert JSON.parse(response.body).dig('authToken')

    # confirmation can be blank
    payload = {
      username: 'xxxx2',
      password: 'abcdefg',
    }
    post register_path, params: payload, as: :json
    assert_equal response.status, 200
    assert User.find_by(username: 'xxxx2')

    # existing user error
    payload = {
      username: 'xxxx1',
      password: 'abcdefg',
      password_confirmation: 'abcdefg'
    }
    post register_path, params: payload, as: :json
    assert_equal response.status, 400
    assert_equal response.body, { errors: { username: ['has already been taken'] }}.to_json
  end

  test 'POST login' do
    User.create(username: 'xxx', password: 'abcdef')

    post login_path, params: { username: 'xxx', password: 'abcdef'}, as: :json
    assert_equal response.status, 200

    post login_path, params: { username: 'xxx', password: 'aaa'}, as: :json
    assert_equal response.status, 400

    post login_path, params: { username: 'yyy', password: 'abcdef'}, as: :json
    assert_equal response.status, 400
  end

  test 'GET new_token' do
    user = create(:user)
    token = user.generate_token

    get new_token_path, headers: { authorization: "Bearer #{token}" }
    assert_equal response.status, 200

    get new_token_path
    assert_equal response.status, 401

    get new_token_path, headers: { authorization: "Bearer abc" }
    assert_equal response.status, 401
  end

  test 'GET /data' do
    user = create(:user, data: { xxx: { yyy: 'abcde' } }.to_json)
    token = user.generate_token

    get data_path, headers: { authorization: "Bearer #{token}" }
    assert_equal response.status, 200
    assert_equal response.body, { xxx: { yyy: 'abcde' } }.to_json
  end

  test 'PATCH /data' do
    user = create(:user, data: { xxx: { yyy: 'abcde' } }.to_json)
    token = user.generate_token

    patch data_path, params: { xxx: { yyy: 'efgh' } },
          headers: { authorization: "Bearer #{token}" }, as: :json
    assert_equal response.status, 200
    assert_equal user.reload.data, { xxx: { yyy: 'efgh' } }.to_json
  end
end
