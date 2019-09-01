require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test "generate_token" do
    user = create(:user)
    assert user.generate_token
  end
end
