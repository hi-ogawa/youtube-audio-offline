FactoryBot.define do
  factory :user do
    username { "MyString" }
    password { "MyString" }
    password_confirmation { "MyString" }
    data { "MyText" }
  end
end
