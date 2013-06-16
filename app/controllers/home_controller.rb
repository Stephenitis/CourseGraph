class HomeController < ApplicationController
  def d3test
    @tree = Course.first.to_node
  end

  def d3test2
    @tree = Course.first.to_node
  end

end
