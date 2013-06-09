class HomeController < ApplicationController
  def index
      @courses = Course.all
  end

  def show
    @course = Course.find(params[:id])
  end

  def tree
    @tree = Course.find(params[:id]).to_node
  end

  def d3test
    @tree = Course.first.to_node
  end

  def d3test2
    @tree = Course.first.to_node
  end

end
