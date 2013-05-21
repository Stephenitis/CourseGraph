# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130521045625) do

  create_table "courses", :force => true do |t|
    t.integer "requisite_id"
    t.string  "SUBJ"
    t.string  "CRS"
    t.string  "SEC"
    t.string  "TITLE"
    t.string  "INSTRUCTORS"
    t.string  "CRN"
    t.string  "MIN_CRED"
    t.string  "MAX_CRED"
    t.string  "DAYS"
    t.string  "TIME"
    t.string  "RM_CAP"
    t.string  "ENRL"
    t.string  "GLOB_CAP"
    t.string  "LOC_CAP"
    t.string  "AVAIL"
    t.string  "STAT"
    t.string  "FIRECAP"
    t.string  "CAMPUS"
    t.string  "COLLEGE"
    t.string  "LEVEL"
    t.string  "COREQS"
    t.text    "RESTRICTIONS"
    t.text    "PREREQS"
    t.string  "COMMENTS"
  end

  create_table "relationships", :force => true do |t|
    t.integer "requisite_id"
    t.integer "course_id"
    t.string  "type"
    t.boolean "mandatory"
  end

end
